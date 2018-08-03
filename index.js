require('dotenv').config()

const fs   = require('fs');
const request = require('request');
const Base64 = require('js-base64').Base64;

const token = process.env.GITHUB_TOKEN;
const user = process.env.USER;
const organization = 'compbiocore';


const getRepoInfo = (org, repo, type) => {
  return new Promise((resolve, reject) => {

    request({
      url: `https://api.github.com/repos/${organization}/${repo}/${type}`,
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

new Promise((resolve, reject) => {

    request({
      url: `https://api.github.com/orgs/${organization}/repos`,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': user,
        'Accept': 'application/vnd.github.v3+json'
      }
    }, (err, response) => {
      const json = JSON.parse(response.body);
      resolve(json);
    });

}).then((values) => {

  const contentPromises = values.map((repo) => getRepoInfo(organization, repo.name, 'contents'))
  return Promise.all(contentPromises)

}).then((values) => {

  let repos = [];
  const contents = values.map((content) =>
      content.map((file) => {
      if (Object.values(file).indexOf("docs") > -1 ) {
        repos.push(file.url.split("/")[5]);
      }}));

  return repos

}).then((values) => {

  const readmePromises = values.map((item) => getRepoInfo(organization, item, 'readme'))
  return Promise.all(readmePromises)

}).then((values) => {

  return JSON.stringify(values.map((item) => Base64.decode(item.content)))

}).then((str) => {

  fs.writeFileSync('data/readmes.json', str);
  console.log('Data written to data/readmes.json');

});
