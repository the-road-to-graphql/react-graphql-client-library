# react-graphql-client

[![Build Status](https://travis-ci.org/the-road-to-graphql/react-graphql-client-library.svg?branch=master)](https://travis-ci.org/the-road-to-graphql/react-graphql-client-library) [![Slack](https://slack-the-road-to-learn-react.wieruch.com/badge.svg)](https://slack-the-road-to-learn-react.wieruch.com/) [![Greenkeeper badge](https://badges.greenkeeper.io/the-road-to-graphql/react-graphql-client-library.svg)](https://greenkeeper.io/)

The library gives you a simple GraphQL client for React applications. But it shouldn't be used for production. Rather it should be used as inspiration for you and others to contribute to the GraphQL ecosystem.

The library hasn't powerful features. There is no caching, normalization or global state. **But** it works and it should show you that it's not too difficult to start out with the implementation of a simple GraphQL client library. You can look into the source code (_src/_) and the example application (_example/_) to see that there is not too much to it.

If you feel the urge to build a sophisticated GraphQL client library (for React) on top of it, please do it! I encourage everyone to contribute to this ecosystem, because I feel there should be more players in this field. I would love to see this library and repository **as inspiration for you and others to contribute to the GraphQL ecosystem**.

[Are you keen to implement your own React GraphQL client?](https://www.robinwieruch.de/react-graphql-client-library)

## Installation

On the command line, install it with npm: `npm install --save react-graphql-client`

## Setup

In your top level React component, initialize the GraphQL client with a GraphQL endpoint and pass it to the provided Provider component from the library.

```
import React from 'react';
import ReactDOM from 'react-dom';

import GraphQLClient, { Provider } from 'react-graphql-client';

import App from './App';

const client = new GraphQLClient({
  baseURL: 'https://mydomain.com/graphql',
});

ReactDOM.render(
  <Provider value={client}>
    <App />
  </Provider>,
  document.getElementById('root'),
);
```

That's it. The GraphQL client is accessible in every React component due to [React's Context API](https://www.robinwieruch.de/react-context-api/).

## Query

In order to execute a GraphQL query operation, use the Query component that is provided from the library. The Query component implements the render prop pattern with its child as a function specification. In the child as a function, you have access to the result of the query operation and further information such as loading state and errors.

```
import React from 'react';

import { Query } from 'react-graphql-client';

const GET_ORGANIZATION = `
  query (
    $organizationLogin: String!
  ) {
    organization(login: $organizationLogin) {
      name
      url
    }
  }
`;

const App = () =>
  <Query
    query={GET_ORGANIZATION}
    variables={{
      organizationLogin: 'the-road-to-learn-react',
    }}
  >
    {({ data, loading, errors }) => {
      if (!data) {
        return <p>No information yet ...</p>;
      }

      const { organization } = data;

      if (loading) {
        return <p>Loading ...</p>;
      }

      if (errors) {
        return (
          <p>
            <strong>Something went wrong:</strong>
            {errors.map(error => error.message).join(' ')}
          </p>
        );
      }

      return (
        <Organization organization={organization} />
      );
    }}
  </Query>
```

The query executes when it is rendered. The query and optional variables are passed as props to the Query component. Every time one of those props changes, the query will execute again.

## Query with Pagination

In order to query a paginated list of items, you need to pass in sufficient variables to your query. This is specific to your GraphQL API and not to the library. However, after querying more items (e.g. with a "More"-button), there needs to be a resolver function to merge the previous with the new result.

```
import React from 'react';

import { Query } from 'react-graphql-client';

const GET_REPOSITORIES_OF_ORGANIZATION = `
  query (
    $organizationLogin: String!,
    $cursor: String
  ) {
    organization(login: $organizationLogin) {
      name
      url
      repositories(first: 5, after: $cursor) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            id
            name
            url
            watchers {
              totalCount
            }
            viewerSubscription
          }
        }
      }
    }
  }
`;

const resolveFetchMore = (data, state) => {
  const { edges: oldR } = state.data.organization.repositories;
  const { edges: newR } = data.organization.repositories;

  const updatedRepositories = [...oldR, ...newR];

  return {
    organization: {
      ...data.organization,
      repositories: {
        ...data.organization.repositories,
        edges: updatedRepositories,
      },
    },
  };
};

const App = () =>
  <Query
    query={GET_REPOSITORIES_OF_ORGANIZATION}
    variables={{
      organizationLogin,
    }}
    resolveFetchMore={resolveFetchMore}
  >
    {({ data, loading, errors, fetchMore }) => {
      ...

      return (
        <Organization
          organization={organization}
          onFetchMoreRepositories={() =>
            fetchMore({
              query: GET_REPOSITORIES_OF_ORGANIZATION,
              variables: {
                organizationLogin,
                cursor:
                  organization.repositories.pageInfo.endCursor,
              },
            })
          }
        />
      );
    }}
  </Query>

const Organization = ({ organization, onFetchMoreRepositories }) => (
  <div>
    <h1>
      <a href={organization.url}>{organization.name}</a>
    </h1>
    <Repositories
      repositories={organization.repositories}
      onFetchMoreRepositories={onFetchMoreRepositories}
    />

    {organization.repositories.pageInfo.hasNextPage && (
      <button onClick={onFetchMoreRepositories}>More</button>
    )}
  </div>
);
```

After a click on the "More"-button, the results of both lists of repositories should be merged.

## Mutation

Last but not least, there is a Mutation component analog to the Query component which is used to execute a mutation. However, in contrast to the Quert component, the Mutation component doesn't execute the mutation on render. You get an explicit callback function in the render prop child function for it.

```
import React from 'react';

import { Query, Mutation } from 'react-graphql-client';

...

const WATCH_REPOSITORY = `
  mutation($id: ID!, $viewerSubscription: SubscriptionState!) {
    updateSubscription(
      input: { state: $viewerSubscription, subscribableId: $id }
    ) {
      subscribable {
        id
        viewerSubscription
      }
    }
  }
`;

const resolveWatchMutation = (data, state) => {
  const { totalCount } = state.data.repository;
  const { viewerSubscription } = data.updateSubscription.subscribable;

  return {
    repository: {
      viewerSubscription,
      totalCount:
        viewerSubscription === 'SUBSCRIBED'
          ? totalCount + 1
          : totalCount - 1,
    },
  };
};

const Repositories = ({ repositories }) => (
  <ul>
    {repositories.edges.map(repository => (
      <li key={repository.node.id}>
        <a href={repository.node.url}>{repository.node.name}</a>

        <Mutation
          mutation={WATCH_REPOSITORY}
          initial={{
            repository: {
              viewerSubscription:
                repository.node.viewerSubscription,
              totalCount: repository.node.watchers.totalCount,
            },
          }}
          resolveMutation={resolveWatchMutation}
        >
          {(toggleWatch, { data, loading, errors }) => (
            <button
              type="button"
              onClick={() =>
                toggleWatch({
                  variables: {
                    id: repository.node.id,
                    viewerSubscription: isWatch(
                      data.repository.viewerSubscription,
                    )
                      ? 'UNSUBSCRIBED'
                      : 'SUBSCRIBED',
                  },
                })
              }
            >
              {data.repository.totalCount}
              {isWatch(data.repository.viewerSubscription)
                ? ' Unwatch'
                : ' Watch'}
            </button>
          )}
        </Mutation>
      </li>
    ))}
  </ul>
);
```

Within the Mutation component the `data` object should be used to render relevant information. This data can be set with an initial value by using the `initial` prop on the Mutation component. Furthermore, after executing a mutation, a `resolveMutation` function as a prop can be provided to deal with the previous state and the mutation result. In the previous case, the new `totalCount` wasn't provided by the GraphQL API. So you can do it by yourself with this resolver function.

## Contribute

As mentioned, if you are curious, checkout the _examples/_ folder to get a minimal working application. You need to fulfil the following installation instructions for it:

* npm install
* [add your own REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN in .env file](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
  * scopes/permissions you need to check: admin:org, repo, user, notifications
* npm start
* visit `http://localhost:3000`

In addition, checkout the _src/_ folder to see that there is not much to implement for a simple GraphQL client. I hope this helps you to build your own library on top of it by forking this repository.

Otherwise, feel free to improve this repository and to fix bugs for it. However, I wouldn't want to grow it into a powerful GraphQL client library. Rather I would love to see this library and repository as inspiration for you and others to contribute to this new GraphQL ecosystem.

## Want to learn more about React + GraphQL + Apollo?

* Don't miss [upcoming Tutorials and Courses](https://www.getrevue.co/profile/rwieruch)
* Check out current [React Courses](https://roadtoreact.com)
