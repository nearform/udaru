# Udaru
[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![snyk][snyk-badge]][snyk-url]

<img src="https://github.com/nearform/udaru/raw/master/docs/logo.jpg">
Udaru is a Policy Based Access Control (PBAC) authorization module. It supports Organizations, Teams and User entities that are used to build the access model. The policies attached to these entities define the 'Actions' that can be performed by an entity on various 'Resources'.

See the Udaru [website](https://nearform.github.io/udaru/) for complete documentation on Udaru.

`uduaru-core` is a lower level library that's primarily used by `udaru-hapi-plugin`, but can also be used directly for other purposes.

## Install
To install via npm:

```
npm install @nearform/udaru-core
```

## Usage

Simple example taken from [examples/list-orgs.js](examples/list-orgs.js):

```
const udaru = require('@nearform/udaru')()
udaru.organizations.list({}, (err, orgs) => {
  if (err) {
    console.error(err)
  } else {
    console.log(orgs)
  }

  udaru.db.close()
})

```

## Hooks

Hooks are registered using the `udaru.addHook` method and allow you to listen to specific events in udaru life.

Each udaru method exposes a namespaced hook (e.g.: the `udaru.authorize.isUserAuthorized` method exposes the `authorize:isUserAuthorized` hook).

The hook is a node-style callback with three arguments: the method arguments, the method result values and a callback to invoke once done

Simple example taken from [examples/hooks.js](examples/hooks.js):

```
const udaru = require('@nearform/udaru')()

udaru.addHook('authorize:isUserAuthorized', function (error, args, result, done) {
  if (error) {
    console.error(`Authorization errored: ${error}`)
  } else {
    console.log(`Access to ${args[0]} got access: ${result[0].access}`)
  }

  done()
})

udaru.authorize.isUserAuthorized('resource', 'action', 'uid', 'oid', cb) {
  console.log(err, cb.access)
  udaru.db.close()
})
```

## License

Copyright nearForm Ltd 2017. Licensed under [MIT][license].

[license]: ./LICENSE.md
[travis-badge]: https://travis-ci.org/nearform/udaru.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru
[npm-badge]: https://badge.fury.io/js/udaru.svg
[npm-url]: https://npmjs.org/package/udaru
[coveralls-badge]: https://coveralls.io/repos/nearform/udaru/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru
