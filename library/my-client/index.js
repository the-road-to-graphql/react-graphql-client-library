import axios from 'axios';

class GraphQLClient {
  axios;

  constructor({ baseURL, headers }) {
    this.axios = axios.create({
      baseURL,
      headers,
    });
  }

  query({ query, variables }) {
    return this.axios.post('', {
      query,
      variables,
    });
  }

  mutate({ mutation, variables }) {
    return this.axios.post('', {
      query: mutation,
      variables,
    });
  }
}

export default GraphQLClient;
