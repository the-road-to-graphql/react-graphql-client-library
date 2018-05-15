import React from 'react';
import { Consumer } from './Context';

const withClient = Component => props => (
  <Consumer>
    {client => <Component {...props} client={client} />}
  </Consumer>
);

export default withClient;
