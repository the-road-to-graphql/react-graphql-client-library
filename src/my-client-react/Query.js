import React from 'react';
import { isEqual } from 'lodash';

import withClient from './withClient';

class Query extends React.Component {
  state = { data: null, loading: null, errors: null };

  componentDidMount() {
    this.query();
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.variables, prevProps.variables)) {
      this.query();
    }
  }

  query = () => {
    const { query, variables } = this.props;

    this.setState({ loading: true });

    this.props.client
      .query({ query, variables })
      .then(result =>
        this.setState({
          data: result.data.data,
          errors: result.data.errors,
          loading: false,
        }),
      )
      .catch(error =>
        this.setState({ errors: [error], loading: false }),
      );
  };

  render() {
    return this.props.children(this.state);
  }
}

export default withClient(Query);
