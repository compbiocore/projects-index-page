require('dotenv').config()

const fs   = require('fs');
const request = require('request');
const Base64 = require('js-base64').Base64;

const token = process.env.GITHUB_TOKEN;
const user = process.env.USER;

const getRepos = (org) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.github.com/orgs/${org}/repos`,
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

const getRepoInfo = (org, repo, type) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.github.com/repos/${org}/${repo}/${type}`,
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

const repoPromise = getRepos('compbiocore');

repoPromise.then((values) => {
  return JSON.stringify(values.map((item) => item.name))
}).then((str) => {
  fs.writeFileSync('data/repos.json', str);
  console.log("Data written to data/repos.json");
});

let rawdata = fs.readFileSync('data/repos.json');
let repos = JSON.parse(rawdata);

const readmePromises = repos.map((item) => getRepoInfo('compbiocore', item, 'readme'));

Promise.all(readmePromises).then((values) => {
  return JSON.stringify(values, null, 2);
}).then((str) => {
  // values, do stuff with
  fs.writeFileSync('data/readmes.json', str);
  // success case, the file was saved
  console.log('Data written to data/readmes.json');
});


const contentPromises = repos.map((item) => getRepoInfo('compbiocore', item, 'contents'));

Promise.all(contentPromises).then((values) => {
  return JSON.stringify(values, null, 2);
}).then((str) => {
  // values, do stuff with
  fs.writeFileSync('data/contents.json', str);
  // success case, the file was saved
  console.log('Data written to data/contents.json');
});


let readmes_raw = fs.readFileSync("data/readmes.json");
let readmes = JSON.parse(readmes_raw);

const getOverview = (readme) => {
  const decoded_readme = Base64.decode(readme.content);
  console.log(decoded_readme.split("\n"));
}

readmes.map((item) => getOverview(item));
