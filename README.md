# labs-authorization

A component providing authorization functionality

## Database

**Important note:** the app needs PostgreSQL >= 9.5

Running the initial demo (first cut of the service) uses Postgres in a Docker running instance, which can be created with:

```
npm run pg:build
```

Note: In case you have issues building or running it with Docker make sure you have a recent version of docker engine and docker compose.

###Start Postgres in a Docker container

A Docker container with Postgres can be started with:
```
npm run pg:start
```

To see the running container and its ID:
```
docker ps
```

To connect to the running container:
```
docker exec -ti <container_id> <command>
```
e.g.
```
docker exec -ti e343edecaaa7 ls
docker exec -ti e343edecaaa7 bash
docker exec -ti e bash        // short container name
```

###Populate the database

The Authorization database, system user and initial tables
can be created by executing:

```
npm run pg:init
```

Test data can be added with:
```
npm run pg:load-test-data
```

###pgAdmin database access

As the Postgresql docker container has its 5432 port forwarded on the local machine the database can be accessed with pgAdmin.

To access the database using the pgAdmin you have to fill in also the container IP beside the database names and access credentials. The container IP can be seen with `docker ps`.

## Service

The service will respond http calls such as

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

## Setup SuperUser

The init script needs to be run in order to setup the SuperUser: `node service/scripts/init`

If you want to specify a better SuperUser id (default is `SuperUserId`) you can prefix the script as follow:

```
LABS_AUTH_SERVICE_authorization_superUser_id=myComplexId12345 node service/scripts/init
```

**Note:** if you have already ran some tests or loaded the test data, you will need to run `npm pg:init` again to reset the db.

## Load policies from file

Another script is available to load policies from a file

Usage: `node service/script/loadPolicies --org=FOO policies.json`

JSON structure:

```json
{
  "policies": [
    {
      "version": "",
      "name": "policy name",
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

## Service API documentation

The Swagger API documentation gives explanations on the exposed API.

To run Swagger:

```
npm run start:service
```

and then go to `http://localhost:8080/documentation`

The Swagger documentation also gives the ability to execute calls to the API and see their results.


## Testing

Tests are supplied for the service interface and the Hapi wiring (run `npm test`).

The test data in the database are going to be reloaded when running `npm test`.

## ENV variables to set configuration options

There is a default configuration file [`service/lib/config.js`](https://github.com/nearform/labs-authorization/blob/master/src/lib/config.js).

This configuration is the one used in dev environment and we are quite sure the production one will be different :) To override this configuration you can use ENV variables on the server/container/machine you will run the app(s) on.

To override those configuration settings you will have to specify your ENV variables with a [prefix](https://github.com/nearform/labs-authorization/blob/master/src/lib/config.js#L29) and then the "path" to the property you want to override.

```
# service config

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

# env variable override

LABS_AUTH_SERVICE_security_api_servicekeys_private_0=jerfkgfjdedfkg3j213i43u31jk2erwegjndf
```

To achieve this we use the [`reconfig`](https://github.com/namshi/reconfig) module


## Solution Usage

This looks somewhat as follows:

![Authorization Architecture](./docs/authorization.png)
