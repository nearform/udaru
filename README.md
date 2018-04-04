# Udaru
[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![snyk][snyk-badge]][snyk-url]

![Udaru](./docs/logo.jpg)
Udaru is a Policy Based Access Control (PBAC) authorization module. It supports Organizations, Teams and User entities that are used to build the access model. The policies attached to these entities define the 'Actions' that can be performed by an entity on various 'Resources'.

See the Udaru [website](https://nearform.github.io/udaru/) for complete documentation on Udaru.

This repository is home to Udaru's three main modules:

| Module                                                                    | Package                                                             |
| ------                                                                    | -------                                                             |
| [@nearform/udaru-core][npm-udaru-core]                                    | [./packages/udaru-core](./packages/udaru-core)                      |
| [@nearform/udaru-hapi-plugin][udaru-hapi-plugin] (for Hapi v17 and above) | [./packages/udaru-hapi-plugin](./packages/udaru-hapi-plugin)        |
| [@nearform/udaru-hapi-16-plugin][udaru-hapi-16-plugin] (for Hapi v16)     | [./packages/udaru-hapi-16-plugin](./packages/udaru-hapi-16-plugin)  |
| [@nearform/udaru-hapi-server][udaru-hapi-server] (for Hapi v16)           | [./packages/udaru-hapi-server](./packages/udaru-hapi-server)        |

## License

Copyright nearForm Ltd 2017-2018. Licensed under [MIT license](https://choosealicense.com/licenses/mit).


[npm-udaru-core]: https://www.npmjs.com/package/@nearform/udaru-core
[udaru-hapi-plugin]: https://www.npmjs.com/package/udaru/@nearform/udaru-hapi-plugin
[udaru-hapi-16-plugin]: https://www.npmjs.com/package/udaru/@nearform/udaru-hapi-16-plugin
[travis-badge]: https://travis-ci.org/nearform/udaru.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru
[npm-badge]: https://badge.fury.io/js/%40nearform/udaru-core.svg
[npm-url]: https://npmjs.org/package/@nearform/udaru-core

[coveralls-badge]: https://coveralls.io/repos/nearform/udaru/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru
