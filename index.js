require('dotenv').config()

const fs   = require('fs');
const request = require('request');
const Base64 = require('js-base64').Base64;
const _ = require('lodash');

const token = process.env.GITHUB_TOKEN;
const user = process.env.USER;
const organization = 'compbiocore';

/**
 * Returns a promise that resolves to a Github API response.
 */
const githubRequest = (path) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.github.com/${path}`,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': user,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (err, response) => {
      resolve(JSON.parse(response.body));
    });
  });
};

/**
 * The procedure below gets a list of repositories for the organization using
 * the repos API, for each repo, it checks if there is a docs folder using the
 * contents API. If the repo has a docs folder, then we get the README file
 * content using the readme API.
 *
 */
githubRequest(`orgs/${organization}/repos`).then((values) => {
  // gets the contents of the repos
  return Promise.all(values.map((repo) => {
    return githubRequest(`repos/${organization}/${repo.name}/contents`)
  }));
}).then((values) => {
  // checks if the repo contains the docs folder
  return _.compact(_.flatten(values.map((content) =>
    content.map((file) => {
      if (Object.values(file).includes('docs')) return file.url.split('/')[5];
    })
  )));
}).then((values) => {
  // gets the README of the repos that have docs folder
  return Promise.all(values.map((item) => {
    return githubRequest(`repos/${organization}/${item}/readme`);
  }))
}).then((values) => {
  // decode and save readme content
  const str = JSON.stringify(values.map((item) => Base64.decode(item.content)));
  fs.writeFileSync('data/readmes.json', str);
  console.log('Data written to data/readmes.json');
});
