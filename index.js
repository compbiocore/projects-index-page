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
      const json = JSON.parse(response.body);
      resolve(json);
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
  const contentPromises = values.map((repo) => githubRequest(`repos/${organization}/${repo.name}/contents`))
  return Promise.all(contentPromises)
}).then((values) => {
  // checks if the repo contains the docs folder
  return _.compact(_.flatten(values.map((content) =>
    content.map((file) => {
      if (Object.values(file).includes('docs')) return file.url.split('/')[5];
    })
  )));
}).then((values) => {
  // gets the README of the repos that have docs folder
  const readmePromises = values.map((item) => githubRequest(`repos/${organization}/${item}/readme`))
  return Promise.all(readmePromises)
}).then((values) => {
  // decode and stringify README content
  return JSON.stringify(values.map((item) => Base64.decode(item.content)))
}).then((str) => {
  // save READMEs to file
  fs.writeFileSync('data/readmes.json', str);
  console.log('Data written to data/readmes.json');
});
