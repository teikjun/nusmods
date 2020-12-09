import { Module } from 'types/modules';
/** @var {Module} */
import { CS1010S } from '__mocks__/modules';

import ModulePageContent from './ModulePageContent';
import reducers from 'reducers';
import { initAction } from 'test-utils/redux';
import configureStore from 'bootstrapping/configure-store';
import renderWithRouterMatch from 'test-utils/renderWithRouterMatch';
import { Provider } from 'react-redux';
import { screen } from '@testing-library/react';
import { mockDom, mockDomReset } from 'test-utils/mockDom';

describe(ModulePageContent, () => {
  const initialState = reducers(undefined, initAction());

  function make(module: Module = CS1010S) {
    const { store } = configureStore(initialState);
    return renderWithRouterMatch(
      <Provider store={store}>
        <ModulePageContent module={module} />
      </Provider>,
      {
        location: '/archive/CS1010S/2017-2018',
      },
    );
  }

  beforeEach(() => {
    mockDom();
  });

  afterEach(() => {
    mockDomReset();
  });

  test('side menu items should appear in the same order in the document', () => {
    make();
    const orderedSideMenuItems = screen
      .getAllByRole('link')
      .map((elem) => elem.textContent?.toLowerCase());
    const orderedDocumentItems = screen.getAllByTestId('side-menu-items').map((elem) => elem.id);
    expect(orderedSideMenuItems).toEqual(orderedDocumentItems);
  });
});
