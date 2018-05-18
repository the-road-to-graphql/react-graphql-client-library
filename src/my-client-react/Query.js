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

  queryMore = ({ query, variables }) => {
    this.props.client
      .query({ query, variables })
      .then(result =>
        this.setState(state => ({
          data: this.props.resolveFetchMore(result.data.data, state),
          errors: result.data.errors,
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
      fetchMore: this.queryMore,
    });
  }
}

export default withClient(Query);
