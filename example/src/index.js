import React from 'react';
import ReactDOM from 'react-dom';

import GraphQLClient, { Provider } from 'react-graphql-client';

import App from './App';
import registerServiceWorker from './registerServiceWorker';

const client = new GraphQLClient({
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
