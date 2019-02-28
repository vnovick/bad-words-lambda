const fetch = require('node-fetch');
const Filter = require('bad-words'),

      const filter = new Filter();

const hgeEndpoint = process.env.HGE_ENDPOINT;
const adminSecret = process.env.ADMIN_SECRET;

const query = `
mutation verifiedp($id: uuid!, $title: String!, $content: String!) {
  update_posts(_set: { verified: true, content: $content, title: $title }, 
    where:{ id: { _eq: $id } }) {
    returning {
      id
    }
  }
}
`;

exports.handler = (event, context, callback) => {
  let request;
  try {
    request = JSON.parse(event.body);
  } catch (e) {
    return callback(null, {statusCode: 400, body: 'cannot parse hasura event'});
  }

  const qv = {
    id: request.event.data.new.id,
    title: filter.clean(request.event.data.new.title),
    content: filter.clean(request.event.data.new.content)
  };
  fetch(hgeEndpoint + '/v1alpha1/graphql', {
    method: 'POST',
    body: JSON.stringify({query: query, variables: qv}),
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': adminSecret
    },
  })
      .then(res => res.json())
      .then(json => {
        callback(null, {statusCode: 200, body: 'success'});
      });
};