# Udaru
[![npm][npm-badge]][npm-url]
[![travis][travis-badge]][travis-url]
[![coveralls][coveralls-badge]][coveralls-url]
[![snyk][snyk-badge]][snyk-url]

Udaru is an authorization module that can be used as an Policy Based Access Control mechanism. It supports Organizations, Teams and User entities that are used to build the access model. The policies attached to these entities define the 'Actions' that can be performed by an entity on various 'Resources'.

Udaru can be used as a stand-alone module, as a stand-alone server or as a Hapi plugin. This repository contains the code for all three running configurations.

A detailed explanation on how the Udaru is structured and the terms and elements used to define the authorization system can be found in the [Udaru Introduction][] document.

Examples on how to model an Udaru organization structure are documented in [Authorization Model][].

## Install
To install via npm:

```
npm install udaru
```

## Testing, benching & linting
Before running tests, ensure a valid Postgres database is running. The simplest way to do this is via Docker. Assuming docker is installed on your machine, in the root folder, run:

```
docker-compose up
```

This will start a Postgres database. Running test or coverage runs will automatically populate the
database with the information it needs.

> Note: you can also run `docker-compose up -d` to run it in the background. You'll can then tail the Postgres logs if needed with `docker-compose logs --tail=100 -f` 

To run tests:

```
npm run test
```

> Note: running the tests will output duplicate keys errors in Postgres logs, this is expected, as the error handling of those cases is part of what is tested.


To lint the repository:

```
npm run lint
```

To fix (most) linting issues:

```
npm run lint -- --fix
```

To run a bench test on a given route:

```
npm run bench -- "METHOD swagger/route/template/path"
```

To obtain a coverage report:

```
npm run coverage
```

## Usage

### Stand-alone module
```js
const udaru = require('udaru')
...
```

### Stand alone server
```
npm run start
```

### Hapi plugin
```js
const Hapi = require('hapi')
const UdaruPlugin = require('udaru/plugin')

...

const server = new Hapi.server()
server.register({register: UdaruPlugin})
```

### Database support
Udaru requires an instance of Postgres to function correctly. For simplicity, a preconfigured `docker-compose` file has been provided. To run:

```
docker-compose up
```

- **Note:** Ensure you are using the latest version of Docker for (Linux/OSX/Windows)
- **Note:** Udaru needs PostgreSQL >= 9.5

#### Populate the database
The Authorization database, system user and initial tables can be created by executing:

```
npm run pg:init
```

Test data can be added with:

```
npm run pg:load-test-data
```

- **Note:** Running a test or coverage command will auto run these commands

### pgAdmin database access
As the Postgresql docker container has its 5432 port forwarded on the local machine the database can be accessed with pgAdmin.

To access the database using the pgAdmin you have to fill in also the container IP beside the database names and access credentials. The container IP can be seen with `docker ps`.

### Migrations
We use [`postgrator`][postgrator] for database migrations. You can find the sql files in the [`database/migrations`](/database/migrations) folder. To run the migrations manually:

```
node database/migrate.js --version=<version>`
```

- **Note:** Running the tests or init commands will automaticaly bring the db to the latest version.

## Service

The service will respond http calls such as:

```
GET /authorization/users
```

with data in the form:

```
[
  { id: 'CharlieId', name: 'Charlie Bucket' },
  { id: 'GrandpaId', name: 'Grandpa Joe' },
  { id: 'VerucaId', name: 'Veruca Salt' },
  { id: 'WillyId', name: 'Willy Wonka' }
]
```

To get more information see [Service Api documentation](#service-api-documentation)

### Setup SuperUser

The init script needs to be run in order to setup the SuperUser: `node scripts/init`

If you want to specify a better SuperUser id (default is `SuperUserId`) you can prefix the script as follow:

```
UDARU_SERVICE_authorization_superUser_id=myComplexId12345 node scripts/init
```

**Note:** if you have already ran some tests or loaded the test data, you will need to run `npm pg:init` again to reset the db.

### Load policies from file

Use the following script to load policies from a file:

Usage: `node script/loadPolicies --org=FOO policies.json`

JSON structure:

```
{
  "policies": [
    {
      "id": "unique-string", // <== optional
      "version": "",
      "name": "policy name",
      "organizationId": "your_organization" // <== optional, if present will override the "--org=FOO" parameter
      "statements": [
        {
          "Effect": "Allow/Deny",
          "Action": "act",
          "Resource": "res"
        },
        { /*...*/ }
      ]
    },
    { /*...*/ }
  ]
}
```

### Service API documentation
The Swagger API documentation gives explanations on the exposed API.

To run Swagger:

```
npm run start
```

and then go to [`http://localhost:8080/documentation`][swagger-link]

The Swagger documentation also gives the ability to execute calls to the API and see their results.

### ENV variables to set configuration options
There is a default configuration file [`lib/core/config/index.js`][config].

This configuration is the one used in dev environment and we are quite sure the production one will be different :) To override this configuration you can use ENV variables on the server/container/machine you will run Udaru on.

To override those configuration settings you will have to specify your ENV variables with a [prefix][prefix-link] and then the "path" to the property you want to override.

**Configuration**
```
{
  security: {
    api: {
      servicekeys: {
        private: [
          '123456789'
        ]
      }
    }
  }
}
```

**ENV variable override**
```
UDARU_SERVICE_security_api_servicekeys_private_0=jerfkgfjdedfkg3j213i43u31jk2erwegjndf
```

To achieve this we use the [`reconfig`][reconfig] module.

## Security

Udaru has been thoroughly evaluated against SQL injection, a detailed description of this can be found in the [SQL Injection][] document.

To automatically run [sqlmap][] injection tests run:
```
npm run test:security
```

These tests are not included in the main test suite. The security test spawns a hapi.js server exposing the Udaru routes. It only needs the DB to be running and being initialized with data.

The injection tests can be configured in the [sqlmap config][]. A few output configuration changes that can be made:
- `level` can be set to 5 for more aggressive testing
- `risk` can be set to 3 for more testing options. Note: this level might alter the DB data
- `verbose` can be set to level 1-5. Level 1 displays info about the injections tried

See the [sqlmap][] repository for more details.

## License
Copyright nearForm Ltd 2017. Licensed under [MIT][license].

[config]: https://github.com/nearform/labs-authorization/blob/master/lib/core/config/index.js
[license]: ./LICENSE.md
[postgrator]: https://github.com/rickbergfalk/postgrator
[prefix-link]: https://github.com/nearform/labs-authorization/blob/master/lib/core/config.js#L100
[reconfig]: https://github.com/namshi/reconfig
[swagger-link]: http://localhost:8080/documentation
[Udaru Introduction]: docs/authorization-introduction.md
[Authorization Model]: docs/authmodel.md
[SQL Injection]: docs/sqlinjection.md
[sqlmap]: https://github.com/sqlmapproject/sqlmap
[sqlmap config]: ./security/fixtures/injection-endpoints.json

[travis-badge]: https://travis-ci.org/nearform/labs-authorization.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/labs-authorization
[npm-badge]: https://badge.fury.io/js/labs-authorization.svg
[npm-url]: https://npmjs.org/package/labs-authorization
[logo-url]: https://raw.githubusercontent.com/nearform/labs-authorization/master/assets/labs-authorization.png
[coveralls-badge]: https://coveralls.io/repos/nearform/labs-authorization/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/labs-authorization?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/labs-authorization/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/labs-authorization
