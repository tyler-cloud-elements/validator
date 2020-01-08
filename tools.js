const fs = require('fs');
const config = require('./config').default;

const buildHeaders = (extraHeaders) => ({
  Authorization: config.auth,
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...extraHeaders
});

exports.buildOptions = (method, uri, query, body, extraHeaders = {}) => ({
  method,
  uri,
  qs: query,
  body,
  headers: buildHeaders(extraHeaders),
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

exports.getElementKeyFromPath = path => path.split('.')[0];

const getFormattedName = (str) =>
  str.length < 8 
    ? `${str}\t\t\t`
    : str.length < 16
      ? `${str}\t\t`
      : `${str}\t`;

const getFormattedValue = (val) =>
  val && val.toString().length > 7
    ? `${val.toString().slice(8)}\t`
    : val && val.toString().length < 5
      ? `${val}\t\t`
      : `${val}\t`;

exports.printAnalytics = (timingMap, analyticsAmount) => {
  console.log('\n---------------------------------------------------------------------------------');
  console.log('|\tElement\t\t\t|  Total(s)\t|  ESV(s)\t|  IRS(s)\t|');
  console.log(' -------------------------------------------------------------------------------');
  
  Object.keys(timingMap)
  .sort((a, b) => timingMap[b].total - timingMap[a].total)
  .slice(0, parseInt(analyticsAmount, 10))
  .forEach(elementKey => {
    console.log(`|\t${getFormattedName(elementKey)}|  ${getFormattedValue(timingMap[elementKey].total)}|  ${getFormattedValue(timingMap[elementKey].esv)}|  ${getFormattedValue(timingMap[elementKey].irs)}|`);
  });
  console.log('---------------------------------------------------------------------------------');
}

// IDK what's up here... https://stackoverflow.com/a/46842181
async function filter(arr, callback) {
  const fail = Symbol();
  return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail)))
    .filter(i=> i!==fail);
}

exports.promiseFilter = filter;