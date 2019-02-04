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

### Database support

Udaru requires an instance of Postgres (version 9.5+) to function correctly. For simplicity, a preconfigured `docker-compose` file has been provided. To run:

```
docker-compose up
```

-   **Note:** Ensure you are using the latest version of Docker for (Linux/OSX/Windows)
-   **Note:** Udaru needs PostgreSQL >= 9.5

#### Populate the database
The Authorization database, system user and initial tables can be created by executing:

```
npm run pg:init
```

Test data can be added with:

```
npm run pg:load-test-data
```

-   **Note:** Running a test or coverage command will auto run these commands

#### Volume data set installation and bench tests
The Authorization database can be further initialized with a larger volume of data, which can be tested using autocannon bench tests in order to demonstrate the potential throughput of the authorization API.

To populate the database with volume data, execute the following command:

```
npm run pg:init-volume-db
```

-   **Note:** Running this command will auto run the standard database population commands also

All volume data sits under the organization 'CONCH' and has the following default setup:
-   500 teams
-   100 users per team (the first of every 100 being the parent of subsequent 99)
-   10 policies per team

After loading the data, the autocannon bench tests can be run by executing:

```
npm run bench:volume
```

This will run 15 second autocannon tests, which fire multiple concurrent requests at 2 frequently used endpoints. This results in the database being queried randomly across the entire set of data giving a good indication of average end-to-end latency and potential requests per second for a database containing 50K users.


### pgAdmin database access
As the Postgresql docker container has its 5432 port forwarded on the local machine the database can be accessed with pgAdmin.

To access the database using the pgAdmin you have to fill in also the container IP beside the database names and access credentials. The container IP can be seen with `docker ps`.  Use IP 127.0.0.1 and use postgres as username/password to connect to database server.

### Migrations
We use [`postgrator`][postgrator] for database migrations. You can find the sql files in the [`database/migrations`](https://github.com/nearform/udaru/tree/master/database/migrations) folder. To run the migrations manually:

```
node packages/udaru-core/database/migrate.js --version=<version>`
```

-   **Note:** Running the tests or init commands will automaticaly bring the db to the latest version.

To get more information see [Service Api documentation](#service-api-documentation)

### Setup SuperUser

The init script needs to be run in order to setup the SuperUser: `node packages/udaru-core/scripts/init`

If you want to specify a better SuperUser id (default is `SuperUserId`) you can prefix the script as follow:

```
UDARU_SERVICE_authorization_superUser_id=myComplexId12345 node packages/udaru-core/scripts/init
```

-   **Note:** if you have already ran some tests or loaded the test data, you will need to run `npm run pg:init` again to reset the db.

### Load policies from file

Run the following script to load policies:

Usage: `node packages/udaru-core/scripts/loadPolicies --org=FOO policies.json`

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

### ENV variables to set configuration options
There are three default configuration files, one per "level": [`packages/udaru-core/config.js`][core-config], [`packages/udaru-hapi-16-plugin/config.js`][plugin-config] and [`packages/udaru-server/config.js`][server-config].

They are cumulative: when running udaru as a standalone server all the three files will be loaded; when using it as an Hapi plugin, plugin and core will be loaded.

This configuration is the one used in dev environment and we are quite sure the production one will be different :) To override this configuration you can:

-   provide a config object when using it as a standalone module or hapi server
-   ENV variables on the server/container/machine you will run Udaru on.

### Config object

**Standalone module**
```js
const buildUdaru = require('@nearform/udaru-core')
const udaru = buildUdaru(dbPool, {
  logger: {
    pino: {
      level: 'warn'
    }
  }
}})
```

**Hapi plugin**
```js
async function () {
  const server = Hapi.Server()
  const UdaruPlugin = require('@nearform/udaru-hapi-plugin')

  await server.register({
    plugin: UdaruPlugin,
    options: {dbPool, config: {
      api: {
        servicekeys: {
          private: ['123456789']
        }
      }
  }}})

  await server.start()

  return server
}
```

**Hapi 16 plugin**

```js
const Hapi = require('hapi')
const UdaruPlugin = require('@nearform/udaru-hapi-16-plugin')
const server = new Hapi.server()
server.register({
  register: UdaruPlugin,
  options: {dbPool, config: {
    api: {
      servicekeys: {
        private: ['123456789']
      }
    }
}}})
```

**ENV variable override**
```
UDARU_SERVICE_security_api_servicekeys_private_0=jerfkgfjdedfkg3j213i43u31jk2erwegjndf
```

To achieve this we use the [`reconfig`][reconfig] module.

## Testing, benching & linting

Before running tests, ensure a valid Postgres database is running. The simplest way to do this is via Docker. Assuming docker is installed on your machine, in the root folder, run:

```
docker-compose up -d
```

This will start a Postgres database. Running test or coverage runs will automatically populate the database with the information it needs.

-   **Note:** you can tail the Postgres logs if needed with `docker-compose logs --tail=100 -f`

To run tests:

```
npm run test
```

-   **Note:** running the tests will output duplicate keys errors in Postgres logs, this is expected, as the error handling of those cases is part of what is tested.


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

To create coverage reports:

```
npm run coverage
```

To populate the database with large volume of data:

```
npm run pg:init-volume-db
```

To run bench test against populated volume data (2 endpoints)

```
npm run bench:volume
```

For convenience, you can load the volume db and run the bench tests with the single command.

```
npm run bench:load-volume
```

This command will:
-   initialise the db & migrate to latest db schema
-   load the standard test fixtures
-   load the volume fixtures
-   spawn an instance of udaru server
-   run the autocannon tests & display results
-   shut down

## Security

Udaru has been thoroughly evaluated against SQL injection, a detailed description of this can be found in the [SQL Injection][] document.

To automatically run [sqlmap][] injection tests run:
```
npm run test:security
```

-   **Note:** before running this, make sure you have a version of [`Python 2.x`](https://www.python.org) installed in your path.

These tests are not included in the main test suite. The security test spawns a hapi.js server exposing the Udaru routes. It only needs the DB to be running and being initialized with data.

The injection tests can be configured in the [sqlmap config][]. A few output configuration changes that can be made:
-   `level` can be set to 5 for more aggressive testing
-   `risk` can be set to 3 for more testing options. Note: this level might alter the DB data
-   `verbose` can be set to level 1-5. Level 1 displays info about the injections tried

See the [sqlmap][] repository for more details.

Also, Udaru, has some additional security related (penetration) testing available through npm commands based on [OWASP Zed Attack Proxy](https://www.owasp.org/index.php/OWASP_Zed_Attack_Proxy_Project).
End results of the scans are stored as HTML reports in the Udaru documentation and should be reviewed manually post execution.

**Note:** before running this, make sure you have a Docker installed and the weekly Zed Attack proxy might take quite a bit to download (1,5GB + in size). Also note that the API scan is very thorough, extensive and takes quite some time to complete (45+ mins).

To run the baseline scan:
```
npm run test:security:pentest:baseline
```

To run the API attack scan:
```
npm run test:security:pentest:api
```
To run both:
```
npm run test:security:pentest
```
## License

[travis-badge]: https://travis-ci.org/nearform/udaru-hapi-plugin.svg?branch=master
[travis-url]: https://travis-ci.org/nearform/udaru-hapi-plugin
[npm-badge]: https://badge.fury.io/js/udaru-hapi-plugin.svg
[npm-url]: https://npmjs.org/package/udaru-hapi-plugin
[coveralls-badge]: https://coveralls.io/repos/nearform/udaru-hapi-plugin/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/nearform/udaru-hapi-plugin?branch=master
[snyk-badge]: https://snyk.io/test/github/nearform/udaru-hapi-plugin/badge.svg
[snyk-url]: https://snyk.io/test/github/nearform/udaru-hapi-plugin
[postgrator]: https://github.com/rickbergfalk/postgrator
[docs-site]: https://nearform.github.io/udaru
[swagger-docs-url]: https://nearform.github.io/udaru/swagger/
[core-config]: https://github.com/nearform/udaru/blob/master/packages/udaru-core/config.js
[plugin-config]: https://github.com/nearform/udaru/blob/master/packages/udaru-hapi-plugin/lib/config.js
[server-config]: https://github.com/nearform/udaru/blob/master/packages/udaru-hapi-plugin/standalone/config.js
[swagger-link]: http://localhost:8080/documentation
[reconfig]: https://github.com/namshi/reconfig
[sqlmap]: https://github.com/sqlmapproject/sqlmap
[sqlmap config]: https://github.com/nearform/udaru/blob/master/security/fixtures/injection-endpoints.json
[SQL Injection]: docs/sqlinjection.md
[npm-udaru-core]: https://www.npmjs.com/package/@nearform/udaru-core
[udaru-hapi-plugin]: https://www.npmjs.com/package/udaru/@nearform/udaru-hapi-plugin
[udaru-hapi-16-plugin]: https://www.npmjs.com/package/udaru/@nearform/udaru-hapi-16-plugin
[udaru-hapi-server]: https://www.npmjs.com/package/udaru/@nearform/udaru-hapi-serve

Copyright nearForm Ltd 2017-2018. Licensed under [MIT license](https://choosealicense.com/licenses/mit).


