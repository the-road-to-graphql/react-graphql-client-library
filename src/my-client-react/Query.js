import React from 'react';
import { isEqual } from 'lodash';

import withClient from './withClient';

const REQUEST_TYPES = {
  fetch: 'fetch',
  fetchMore: 'fetchMore',
};

class Query extends React.Component {
  state = {
    data: null,
    loading: null,
    fetchMoreLoading: null,
    errors: null,
  };

  componentDidMount() {
    const { query, variables } = this.props;

    this.query({ query, variables }, REQUEST_TYPES.fetch);
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.variables, prevProps.variables)) {
      const { query, variables } = this.props;

      this.query({ query, variables }, REQUEST_TYPES.fetch);
    }
  }

  query = ({ query, variables }, requestType) => {
    if (requestType === REQUEST_TYPES.fetch) {
      this.setState({ loading: true });
    }

    if (requestType === REQUEST_TYPES.fetchMore) {
      this.setState({ fetchMoreLoading: true });
    }

    this.props.client
      .query({ query, variables })
      .then(result =>
        this.setState({
          data: result.data.data,
          errors: result.data.errors,
          loading: false,
          fetchMoreLoading: false,
        }),
      )
      .catch(error =>
        this.setState({
          errors: [error],
          loading: false,
          fetchMoreLoading: false,
        }),
      );
  };

  fetchMore = ({ query, variables }) => {
    this.query({ query, variables }, REQUEST_TYPES.fetchMore);
  };

  render() {
    return this.props.children({
      ...this.state,
      fetchMore: this.fetchMore,
    });
  }
}

export default withClient(Query);
