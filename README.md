# validation

CLI tool to invoke full validation against CE IRS and ESV validation services

## Installation
If you don't have `node` and `npm` installed, do [that](https://docs.npmjs.com/getting-started/installing-node) first.

Install the node dependencies, link validator and setup `config.json` file.

```bash
# Install all necessary npm packages:
$ npm install

# Puts validator CLI on your $PATH:
$ npm link

```

## Usage

```bash
$ validator -h
Usage: validator [options]

Options:
  -V, --version                   output the version number
  -g, --getall                    get element and swaggers
  -v, --validate                  run ESV and IRS validation on existing validations
  -n, --analyticsAmount <number>  add analytics amount to ESV/IRS validation
  -t, --validateType <type>       run specific validation on existing validations
  -a, --skipAll <element>         add element to skip list for IRS and ESV
  -e, --skipElement <element>     add element to skip list for IRS
  -s, --swaggerFailed             find elements where swagger has failed
  -f, --findSpellingMistakes      find elements where there are spelling mistakes
  -x, --expand                    expand a result or do something weird
  -m, --mergeResults <path>       returns a map of validation results
  -c, --configure <env>           configure environment to validate against (snp, stg, usprd, euprd)
  -h, --help                      output usage information  
```

  **Note:** _Requires a file called `config.json` at the root level, structured like:_

  ```
  {
    "default": {
        "url": "https://api.cloud-elements.com",
        "origin": "https://my.cloudelements.io",        
        "auth": "User <<USER_AUTH>>, Organization <<ORG_AUTH>>"
    },
    "snp": {
        "url": "https://snapshot.cloud-elements.com",
        "origin": "https://my-snapshot.cloudelements.io",        
        "auth": "User <<USER_AUTH>>, Organization <<ORG_AUTH>>"
    },
    "stg": {
        "url": "https://staging.cloud-elements.com",
        "origin": "https://my-staging.cloudelements.io",        
        "auth": "User <<USER_AUTH>>, Organization <<ORG_AUTH>>"
    },
    "usprd": {
        "url": "https://api.cloud-elements.com",
        "origin": "https://my.cloudelements.io",
        "auth": "User <<USER_AUTH>>, Organization <<ORG_AUTH>>"
    },
    "euprd": {
        "url": "https://api.cloud-elements.co.uk",
        "origin": "https://my.cloudelements.co.uk",        
        "auth": "User <<USER_AUTH>>, Organization <<ORG_AUTH>>"
    }
}
```
