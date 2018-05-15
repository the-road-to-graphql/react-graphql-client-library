import React from 'react';
import ReactDOM from 'react-dom';

import MyGraphQLClient from './my-client';
import { Provider } from './my-client-react';

import App from './App';
import registerServiceWorker from './registerServiceWorker';

const client = new MyGraphQLClient({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${
      process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  },
});

ReactDOM.render(
  <Provider value={client}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
registerServiceWorker();
