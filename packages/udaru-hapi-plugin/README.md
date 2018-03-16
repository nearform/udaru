# Udaru Hapi Plugin
[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![snyk][snyk-badge]][snyk-url]

![Udaru](./docs/logo.jpg)
Udaru is a Policy Based Access Control (PBAC) authorization module. It supports Organizations, Teams and User entities that are used to build the access model. The policies attached to these entities define the 'Actions' that can be performed by an entity on various 'Resources'.

See the Udaru [website](https://nearform.github.io/udaru/) for complete documentation on Udaru.

## Install
To install via npm:

```
npm install udaru-hapi-plugin
```

## Usage
```js
const Hapi = require('hapi')
const UdaruPlugin = require('udaru-hapi-plugin')

...

const server = new Hapi.server()
server.register({register: UdaruPlugin})
```

## License

Copyright nearForm Ltd 2017. Licensed under [MIT][license].

[license]: ./LICENSE.md
[travis-badge]: https://travis-ci.org/nearform/udaru-hapi-plugin.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru-hapi-plugin
[npm-badge]: https://badge.fury.io/js/udaru-hapi-plugin.svg
[npm-url]: https://npmjs.org/package/udaru-hapi-plugin
[coveralls-badge]: https://coveralls.io/repos/nearform/udaru-hapi-plugin/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru-hapi-plugin?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru-hapi-plugin/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru-hapi-plugin
