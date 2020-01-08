#!/usr/bin/env node

'use strict';

const validator = require('commander');
const {downloadElementAndSwagger, findElementsWithSwaggerIssues, getAllElementsWithSpellingMistakes, mergeValidationResults, runIrsValidation, runValidation} = require('./index');
const {promiseRead, promiseWrite} = require('./tools');

validator
  .version('0.1.0')
  .option('-g, --getall', 'get element and swaggers')
  .option('-v, --validate', 'run ESV and IRS validation on existing validations')
  .option('-n, --analyticsAmount <number>', 'add analytics amount to ESV/IRS validation')
  .option('-t, --validateType <type>', 'run specific validation on existing validations')
  .option('-a, --skipAll <element>', 'add element to skip list for IRS and ESV')
  .option('-e, --skipElement <element>', 'add element to skip list for IRS')
  .option('-s, --swaggerFailed', 'find elements where swagger has failed')
  .option('-f, --findSpellingMistakes', 'find elements where there are spelling mistakes')
  .option('-x, --expand', 'expand a result or do something weird')
  .option('-m, --mergeResults <path>', 'returns a map of validation results')
  .option('-c, --configure <env>', 'configure environment to validate against (snp, stg, usprd, euprd)')
  .parse(process.argv);

if (validator.getall) {
  downloadElementAndSwagger();
}

if (validator.validate) {
  runValidation(validator.analyticsAmount);
}

if (validator.validateType) {
  if (!['irs'].includes(validator.validateType)) {
    throw new Error(`Path ${validator.validateType} not supported`);
  }

  runIrsValidation();
}

if (validator.skipElement) {
  promiseRead(`skips/elementSkipList.json`)
    .then(r => [validator.skipElement, ...r])
    .then(r => promiseWrite(r, 'skips/elementSkipList'));
}

if (validator.skipAll) {
  promiseRead(`skips/skipList.json`)
    .then(r => [validator.skipAll, ...r])
    .then(r => promiseWrite(r, 'skips/skipList'));
}

if (validator.configure) {
  if (!['snp', 'stg', 'usprd', 'euprd'].includes(validator.configure)) {
    throw new Error(`Environment ${validator.configure} not supported`);
  }

  promiseRead(`config.json`)
    .then(r => Object.assign({}, r, { default: r[validator.configure] }))
    .then(r => promiseWrite(r, 'config'));
}

if (validator.swaggerFailed) {
  findElementsWithSwaggerIssues()
    .then(r => console.log(r));
}

if (validator.mergeResults) {
  if (!['esv'].includes(validator.mergeResults)) {
    throw new Error(`Path ${validator.mergeResults} not supported`);
  }

  findElementsWithSwaggerIssues()
    .then(r => mergeValidationResults(r, validator.mergeResults))
    .then(r => console.log(JSON.stringify(r, null, 4)));
}

if (validator.findSpellingMistakes) {
  getAllElementsWithSpellingMistakes()
    .then(r => {
      if (validator.expand) {
        return Object.keys(r).reduce((acc, elementKey) => {
          const warnings = r[elementKey];
          warnings.forEach(warning => {
            const hint = warning.hint;
            if (hint.includes(', try one of: ')) {
              const hints = hint.split(', try one of: ');
              const name = hints[0].substring(hints[0].indexOf('\'') + 1, hints[0].lastIndexOf('\''));
              acc[name] = hints[1];
            }
          });
          return acc;
        }, {})
      }
      
      return r;
    })
    .then(r => console.log(JSON.stringify(r, null, 4)));
}