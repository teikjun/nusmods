import express from 'express';
import bodyParser from 'body-parser';
import expressPlayground from 'graphql-playground-middleware-express';
import config from './config';
import mailService from './mailService';
import TokenController from './TokenController';
import HttpStatus from './HttpStatus';

const app = express();
app.use(bodyParser.json({ limit: '1kb' }));

// Host graphql playground
app.get('/playground', expressPlayground({ endpoint: config.hasuraUrl }));

const tokenController = new TokenController(config.mailTokenLifeTime);

// 1. User tries to create or log in to account,
//    client makes post request to /auth with email
//    server sends a code to email with lifetime of 15 minutes
app.post('/auth', (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send('Missing field `email` of type string in post body.');
  }

  const mailToken = tokenController.request(email);
  if (!mailToken) {
    return res
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .send('Rate limit exceeded, please try again later.');
  }

  if (!config.mailApiKey) {
    return res.send({ mailToken });
  }
  mailService
    .sendToken(email, mailToken)
    .then(() => {
      res.sendStatus(HttpStatus.ACCEPTED);
    })
    .catch(() => {
      // TODO: log error
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Unable to send mail');
    });
});

// 2. User recieves code on email, applies it on client,
//    client makes a post request to /verity with code
//    client receives a long lived refresh token and a short lived access token
//    client stores both tokens
app.post('/verify', (req, res) => {
  const email = req.body.email;
  if (!email) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send('Missing field `email` of type string in post body.');
  }
  const token = req.body.token;
  if (!token) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .send('Missing field `token` of type string in post body.');
  }
  const mailToken = tokenController.verify(email, token);
  if (mailToken == null) {
    return res
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .send('Rate limit exceeded, please try again later.');
  } else if (!mailToken) {
    return res.status(HttpStatus.UNAUTHORIZED).send('Invalid token');
  }
  const accessToken = token.getAccessToken();
  return res.send(accessToken);
});

// 3. User while holding valid refresh token and expired access token,
//    client makes a post request to /refresh with both tokens
//    client receives a new short lived access token
// app.post('/refresh', (req, res) => {});

export default app;
