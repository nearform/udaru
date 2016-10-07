# labs-authorization

A full-stack component providing authorization functionality, designed for use in Labs projects

## Database

Running the initial demo (first cut of the service) requires postgres to
be installed locally.

Instructions at:

http://exponential.io/blog/2015/02/21/install-postgresql-on-mac-os-x-via-brew/

The Authorization database, system user and initial tables (just users at the moment)
can be created by executing:

    npm run init-db
    
_This also currently adds some test data._

## Service

There is a basic service which will respond to a list users request:

    {role: 'auth', cmd: 'list', type: 'users'}

with data in the form:

    [ { userid: 1, name: 'Charlie Bucket' },
      { userid: 2, name: 'Grandpa Joe' },
      { userid: 3, name: 'Veruca Salt' },
      { userid: 4, name: 'Willy Wonka' } ]

It also has a shutdown operation, which should be called when finished with the
service:

    {role: 'auth', cmd: 'done'}

## Testing

Tests are supplied for the service interface and the Mu wiring.
Currently the service will wait 30 seconds for the db connections to go idle
before shutting down and therefore the Mu tests timeout and fail

## Security

Please ignore any security bad practices at the minute!
