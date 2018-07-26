const fs   = require('fs');
const request = require('request');


const getRepos = (org) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.github.com/orgs/${org}/repos`,
      headers: {
        'User-Agent': 'fernandogelin',
        'Accept': 'application/vnd.github.v3.raw+json'
      }
    }, (err, response) => {
      const json = JSON.parse(response.body);
      resolve(json);
    });
  });
};

const getReadme = (org, repo) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.github.com/repos/${org}/${repo}/readme`,
      headers: {
        'User-Agent': 'fernandogelin',
        'Accept': 'application/vnd.github.v3.raw+json'
      }
    }, (err, response) => {
      const json = JSON.parse(response.body);
      resolve(json);
    });
  });
};

const repoPromise = getRepos('compbiocore');

repoPromise.then((values) => {
  const names = values.map((item) => item.name);
  return JSON.stringify(values, null, 2)
}).then((str) => {
  fs.writeFileSync('data/repos.json', str);
  console.log("Data written to data/repos.json");
});

const readmePromises = names.map((item) => getReadme('compbiocore', item));

Promise.all(readmePromises).then((values) => {
  return JSON.stringify(values, null, 2);
}).then((str) => {
  // values, do stuff with
  fs.writeFileSync('data/readmes.json', str);
  // success case, the file was saved
  console.log('Data written to data/readmes.json');
});
