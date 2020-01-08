const rp = require('request-promise');
const {buildOptions, promiseFilter, promiseWrite, promiseRead, printAnalytics, getElementKeyFromPath, getElementNames} = require('./tools');
const config = require('./config').default;
const timingMaps = {};

const retrieveElement = (id) => {
  return rp(buildOptions('GET', `${config.url}/elements/api-v2/elements/${id}`))
    .then(body => promiseWrite(body, `metadata/${body.key}`));
}

const retrieveSwagger = (id, key) => {
  return rp(buildOptions('GET', `${config.url}/elements/api-v2/elements/${id}/docs`, { version : -1 }))
    .then(body => promiseWrite(body, `swagger/${key}`));
}

const validateSwagger = (swaggerPath, elementKey) => {
  const currentTime = new Date();
  return promiseRead(`swagger/${swaggerPath}`)
    .then(swagger => rp(buildOptions('POST', `${config.url}/esv/api/swagger/validate`, null, swagger, { 'X-Element-Key': elementKey })))
    .then(body => {
      timingMaps[elementKey].esv = (new Date() - currentTime) / 1000;
      return promiseWrite(body, `esv/${swaggerPath.split('.')[0]}`);
    })
    .catch(e => {
      console.log(`Swagger validation failed for ${swaggerPath}`);
      throw e;
    });
}

const validateElement = (elementPath, elementKey) => {
  const currentTime = new Date();
  return promiseRead(`skips/elementSkipList.json`)
    .then(skipList => skipList.includes(elementPath))
    .then(r => r 
      ? Promise.reject()
      : promiseRead(`metadata/${elementPath}`)
    )
    .then(element => rp(buildOptions('POST', `${config.url}/irs/validate/element`, null, element, { 'X-Element-Key': elementKey, Origin: config.origin })))
    .then(body => {
      timingMaps[elementKey].irs = (new Date() - currentTime) / 1000;
      return promiseWrite(body, `irs/${elementKey}`);
    })
    .catch(e => {
      if (!e) {
        return Promise.resolve();
      }

      console.log(`Element validation failed for ${elementKey}`);
      throw e;
    });
}

const hitElementsAPI = () => {
  return rp(buildOptions('GET', `${config.url}/elements/api-v2/elements/metadata`, { pageSize: 500 }))
    .then(body => {
      body.reduce((acc, element) => acc.then(() => {
        const {id, key} = element;
        return Promise.all([retrieveElement(id), retrieveSwagger(id, key)])
          .then(r => console.log(`Wrote ${key}`));
      }), Promise.resolve(null))
        .then(() => {
          console.log('done');
        });
    })
    .catch(e => {
      console.log(e);
    });
};

// SWAGGER(TOO BIG???)        NOT AN ELEMENT
//'amazonmarketplace.json', 'googleoauth.json'];
const hitValidationApi = (analyticsAmount) => {
  return getElementNames('metadata')
    // Skip any that have already been validated...
    .then(elements => 
      getElementNames('esv')
        .then(r => elements.filter(e => !r.includes(e))))
        .then(remainingElements => 
          promiseRead(`skips/skipList.json`)
            .then(skipList => remainingElements.filter(e => !skipList.includes(e))))
    .then(elementNames => {
      elementNames
        .reduce((acc, element) => acc.then(() => {
          const elementKey = getElementKeyFromPath(element);
          const currentTime = new Date();
          timingMaps[elementKey] = {};
          console.log(`Validating ${element} @ ${currentTime.toISOString()}`);
          return Promise.all([validateElement(element, elementKey), validateSwagger(element, elementKey)])
            .then(r => {
              const timing = (new Date() - currentTime) / 1000;
              timingMaps[elementKey].total = timing;
              console.log(`-> Validated ${element} took ${timing} seconds`);
            })
        }), Promise.resolve(null))
        .then(r => {
          console.log(`done`);
          if (analyticsAmount) {
            printAnalytics(timingMaps, analyticsAmount);
          }
        });
    });
}

const runIrsValidation = () => {
  return getElementNames('metadata')
    .then(remainingElements => 
        promiseRead(`skips/skipList.json`)
          .then(skipList => remainingElements.filter(e => !skipList.includes(e))))
    .then(elementNames => {
      elementNames
        .reduce((acc, element) => acc.then(() => {
          console.log(`Validating ${element}`);
          return validateElement(element)
            .then(r => console.log(`-> Validated ${element}`))
        }), Promise.resolve(null))
        .then(r => console.log(`done`));
    });
}

async function elementsWithSwaggerIssues() {
  const elementNames = await getElementNames('esv');
  return promiseFilter(elementNames, async name => {
    const esvResult = await promiseRead(`esv/${name}`);
    return esvResult.swaggerValidation.length > 0
      || esvResult.refResolution.length > 0;
  });
}

async function getAllElementsWithSpellingMistakes() {
  const elementNames = await getElementNames('irs');
  return elementNames.reduce((acc, elementName) => acc.then(async obj => {
    let arr = [];
    const irsResult = await promiseRead(`irs/${elementName}`);
    const pathKeys = Object.keys(irsResult); // API path, or EB tab
    pathKeys.forEach(path => {
      const methodKeys = Object.keys(irsResult[path]);
      methodKeys.forEach(method => {
        if (irsResult[path][method].warnings) {
          irsResult[path][method].warnings.forEach(warning => {
            if (warning.message.includes('spelling mistake')) {
              arr.push(warning);
            }
          });
        }
      });
    });
    obj[elementName] = arr;
    return Promise.resolve(obj);
  }), Promise.resolve({}));
}


async function mergeResults(elements, path) {
  return elements.reduce((acc, element) => acc.then(async obj => {
      const validationResult = await promiseRead(`${path}/${element}`);
      obj[element] = validationResult;
      return Promise.resolve(obj);
  }), Promise.resolve({}));
}

exports.runValidation = hitValidationApi;
exports.runIrsValidation = runIrsValidation;
exports.downloadElementAndSwagger = hitElementsAPI;
exports.findElementsWithSwaggerIssues = elementsWithSwaggerIssues;
exports.mergeValidationResults = mergeResults;
exports.getAllElementsWithSpellingMistakes = getAllElementsWithSpellingMistakes;