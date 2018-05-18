import React from 'react';
import { isEqual } from 'lodash';

import withClient from './withClient';

class Mutation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: this.props.initial,
      loading: null,
      errors: null,
    };
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(this.props.initial, prevProps.initial)) {
      this.setState({ data: this.props.initial });
    }
  }

  mutate = ({
    mutation = this.props.mutation,
    variables = this.props.variables,
  }) => {
    const { client, resolveMutation } = this.props;

    client
      .mutate({ mutation, variables })
      .then(result => {
        this.setState(state => ({
          data: resolveMutation(result.data.data, state),
          errors: result.data.errors,
          loading: false,
        }));
      })
      .catch(error =>
        this.setState({
          errors: [error],
          loading: false,
        }),
      );
  };

  render() {
    return this.props.children(this.mutate, this.state);
  }
}

export default withClient(Mutation);
