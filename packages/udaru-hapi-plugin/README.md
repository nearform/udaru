# Hapi Udaru Authentication Plugin
[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![snyk][snyk-badge]][snyk-url]

<img src="https://github.com/nearform/udaru/raw/master/docs/logo.jpg">

Udaru is a Policy Based Access Control (PBAC) authorization module. It supports Organizations, Teams and User entities that are used to build the access model. The policies attached to these entities define the 'Actions' that can be performed by an entity on various 'Resources'.

See the Udaru [website](https://nearform.github.io/udaru/) for complete documentation on Udaru.

## Install
To install via npm:

```
npm install @nearform/udaru-hapi-plugin
```

## Usage
```js
const Hapi = require('hapi')
const UdaruPlugin = require('@nearform/udaru-hapi-plugin')

...

const server = Hapi.server()

await server.register({register: UdaruPlugin})
```

## Hooks

In order to register udaru hooks, just provide a `hooks` key in the plugin options where keys are the names and values are handler functions (or array of functions).

```js
const Hapi = require('hapi')
const UdaruPlugin = require('@nearform/udaru-hapi-plugin')

...

const server = new Hapi.server()

await server.register({
  register: UdaruPlugin,
  options: {
    // Other options here
    hooks: {
      'authorize:isUserAuthorized': [
        async function (error, args, result) {
          if (error) {
            console.error(`Authorization errored: ${error}`)
          } else {
            console.log(`Access to ${args[0]} got access: ${result[0].access}`)
          }
        }
      ]
    }
  }
})
```

## License

Copyright nearForm Ltd 2017. Licensed under [MIT][license].

[license]: ./LICENSE.md
[travis-badge]: https://travis-ci.org/nearform/udaru.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru
[npm-badge]: https://badge.fury.io/js/%40nearform%2Fudaru-hapi-plugin.svg
[npm-url]: https://npmjs.org/package/%40nearform%2Fudaru-hapi-plugin
[coveralls-badge]: https://coveralls.io/repos/nearform/udaru/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru
