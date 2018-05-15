import React from 'react';
import { isEqual } from 'lodash';

import withClient from './withClient';

class Query extends React.Component {
  state = {
    data: null,
    loading: null,
    fetchMoreLoading: null,
    errors: null,
  };

  componentDidMount() {
    const { query, variables } = this.props;

    this.query({ query, variables });
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.variables, prevProps.variables)) {
      const { query, variables } = this.props;

      this.query({ query, variables });
    }
  }

  query = ({ query, variables }) => {
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
        this.setState({
          errors: [error],
          loading: false,
        }),
      );
  };

  fetchMore = ({ query, variables }) => {
    this.queryMore({ query, variables });
  };

  queryMore = ({ query, variables }) => {
    this.props.client
      .query({ query, variables })
      .then(result =>
        this.setState(state => ({
          ...this.props.resolveFetchMore(result, state),
          fetchMoreLoading: false,
        })),
      )
      .catch(error =>
        this.setState({
          errors: [error],
          fetchMoreLoading: false,
        }),
      );
  };

  render() {
    return this.props.children({
      ...this.state,
      fetchMore: this.fetchMore,
    });
  }
}

export default withClient(Query);
