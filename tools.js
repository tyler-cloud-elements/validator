const fs = require('fs');
const config = require('./config').default;

const buildHeaders = () => ({
  Authorization: config.auth,
  Accept: 'application/json',
  'Content-Type': 'application/json'
});

exports.buildOptions = (method, uri, query, body) => ({
  method,
  uri,
  qs: query,
  body,
  headers: buildHeaders(),
  json: true,
});

exports.promiseWrite = (body, path) => new Promise((res, rej) => {
  fs.writeFile(`${__dirname}/${path}.json`, JSON.stringify(body, null, 4), 'utf8', (err) => {
    if (err) rej(err);

    res();
  });
});

exports.promiseRead = (path) => new Promise((res, rej) => {
  fs.readFile(`${__dirname}/${path}`, (err, data) => {
    if (err) rej(err);
    if (!data) {
      console.error(`${path} is invalid`);
    }

    res(JSON.parse(data));
  });
});

exports.getElementNames = (path = 'elements') => new Promise((res, rej) => {
  fs.readdir(`${__dirname}/${path}`, (err, files) => {
    if (err) rej(err);

    res(files);
  });
});

// IDK what's up here... https://stackoverflow.com/a/46842181
async function filter(arr, callback) {
  const fail = Symbol();
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail)))
    .filter(i=> i!==fail);
}

exports.promiseFilter = filter;