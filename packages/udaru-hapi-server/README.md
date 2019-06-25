# Hapi Udaru Server
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
npm install @nearform/udaru-hapi-server
```

## Usage

```
npm run start
```

## Documentation

The Udaru documentation site can be found at [nearform.github.io/udaru][docs-site].

### Swagger API Documentation

The Swagger API documentation gives explanations on the exposed API. The documentation can be found at [nearform.github.io/udaru/swagger/][swagger-docs-url].

It is also possible to access the Swagger documentation from Udaru itself. Simply start the server:

```
npm run start
```

and then go to [`http://localhost:8080/documentation`][swagger-link]

The Swagger documentation also gives the ability to execute calls to the API and see their results. If you're using the test database, you can use 'ROOTid' as the required authorization parameter and 'WONKA' as the organisation.

## License

Copyright nearForm Ltd 2017. Licensed under [MIT][license].

[license]: ./LICENSE.md
[travis-badge]: https://travis-ci.org/nearform/udaru.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru
[npm-badge]: https://badge.fury.io/js/%40nearform%2Fudaru-hapi-server.svg
[npm-url]: https://npmjs.org/package/%40nearform%2Fudaru-hapi-server
[coveralls-badge]: https://coveralls.io/repos/nearform/udaru/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru
[swagger-link]: http://localhost:8080/documentation
[docs-site]: https://nearform.github.io/udaru
[swagger-docs-url]: https://nearform.github.io/udaru/swagger/
