import React, { Component } from 'react';

import { Query, Mutation } from './my-client-react';

const TITLE = 'React GraphQL GitHub Client';

const GET_ISSUES_OF_REPOSITORY = `
  query (
    $organization: String!,
    $repository: String!,
    $cursor: String
  ) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        watchers {
          totalCount
        }
        viewerSubscription
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

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

const resolveFetchMore = (data, state) => {
  const {
    edges: oldIssues,
  } = state.data.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        },
      },
    },
  };
};

const resolveWatchMutation = (data, state) => {
  const { totalCount } = state.data.updateSubscription.subscribable;
  const { viewerSubscription } = data.updateSubscription.subscribable;

  return {
    updateSubscription: {
      subscribable: {
        viewerSubscription: viewerSubscription,
        totalCount:
          viewerSubscription === 'SUBSCRIBED'
            ? totalCount + 1
            : totalCount - 1,
      },
    },
  };
};

const isWatch = updateSubscription =>
  updateSubscription.subscribable.viewerSubscription === 'SUBSCRIBED';

class App extends Component {
  state = {
    value: 'the-road-to-learn-react/the-road-to-learn-react',
    path: 'the-road-to-learn-react/the-road-to-learn-react',
  };

  onChange = event => {
    this.setState({ value: event.target.value });
  };

  onSubmit = event => {
    this.setState({ path: this.state.value });

    event.preventDefault();
  };

  render() {
    const { path, value } = this.state;
    const [organizationName, repositoryName] = path.split('/');

    return (
      <div>
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com/
          </label>
          <input
            id="url"
            type="text"
            value={value}
            onChange={this.onChange}
            style={{ width: '300px' }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />

        <Query
          query={GET_ISSUES_OF_REPOSITORY}
          variables={{
            organization: organizationName,
            repository: repositoryName,
          }}
          resolveFetchMore={resolveFetchMore}
        >
          {({ data, loading, errors, fetchMore }) => {
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
              <Organization
                organization={organization}
                errors={errors}
                onFetchMoreIssues={() =>
                  fetchMore({
                    query: GET_ISSUES_OF_REPOSITORY,
                    variables: {
                      organization: organizationName,
                      repository: repositoryName,
                      cursor:
                        organization.repository.issues.pageInfo
                          .endCursor,
                    },
                  })
                }
              />
            );
          }}
        </Query>
      </div>
    );
  }
}

const Organization = ({
  organization,
  errors,
  onFetchMoreIssues,
}) => (
  <div>
    <p>
      <strong>Issues from Organization:</strong>
      <a href={organization.url}>{organization.name}</a>
    </p>
    <Repository
      repository={organization.repository}
      onFetchMoreIssues={onFetchMoreIssues}
    />
  </div>
);

const Repository = ({ repository, onFetchMoreIssues }) => (
  <div>
    <p>
      <strong>In Repository:</strong>
      <a href={repository.url}>{repository.name}</a>
    </p>
    <Mutation
      mutation={WATCH_REPOSITORY}
      initial={{
        updateSubscription: {
          subscribable: {
            viewerSubscription: repository.viewerSubscription,
            totalCount: repository.watchers.totalCount,
          },
        },
      }}
      resolveMutation={resolveWatchMutation}
    >
      {(toggleWatch, { data, loading, errors }) => {
        return (
          <button
            type="button"
            onClick={() =>
              toggleWatch({
                variables: {
                  id: repository.id,
                  viewerSubscription: isWatch(data.updateSubscription)
                    ? 'UNSUBSCRIBED'
                    : 'SUBSCRIBED',
                },
              })
            }
          >
            {data.updateSubscription.subscribable.totalCount}
            {isWatch(data.updateSubscription) ? ' Unwatch' : ' Watch'}
          </button>
        );
      }}
    </Mutation>

    <Issues
      issues={repository.issues}
      onFetchMoreIssues={onFetchMoreIssues}
    />
  </div>
);

const Issues = ({ issues, onFetchMoreIssues }) => (
  <div>
    <ul>
      {issues.edges.map(issue => (
        <li key={issue.node.id}>
          <a href={issue.node.url}>{issue.node.title}</a>

          <ul>
            {issue.node.reactions.edges.map(reaction => (
              <li key={reaction.node.id}>{reaction.node.content}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>

    <hr />

    {issues.pageInfo.hasNextPage && (
      <button onClick={onFetchMoreIssues}>More</button>
    )}
  </div>
);

export default App;
