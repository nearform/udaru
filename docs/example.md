# Example API Usage

The following is a highly contrived example usage of the Udaru Management and Authorizations APIs. The curl commands below are provided as examples only; we do not recommend you do this in any real world platform :-)

To follow along below, start by running Udaru locally as described in the [ReadMe](../README.md), and seed Udaru by running 

```
npm run pg:init
```

That will create the initial tables and ROOTid user used in the examples below.

Note that it's also possible to follow the example below using the live Swagger UI, also as described in the [ReadMe](../README.md).

# Wayne Manor Example

* Create a 'Wayne Manor Organization' to manage authorization to Batmans stuff, with 'Bruce Wayne' as the root owner:

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' -d '{"id":"WayneManor","name":"Wayne Manor","description":"Wayne Manor Organisation","user":{"id":"BruceWayne","name":"Bruce Wayne"}}' 'http://localhost:8080/authorization/organizations'

```

Response:

```javascript
{
  "organization": {
    "id": "WayneManor",
    "name": "Wayne Manor",
    "description": "Wayne Manor Organisation",
    "policies": []
  },
  "user": {
    "id": "BruceWayne",
    "name": "Bruce Wayne"
  }
}
```

This creates our Organization, and one super user, 'Bruce Wayne'. We can verify this with:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' 'http://localhost:8080/authorization/organizations'
```

and also verify our 'Bruce Wayne' user exists with:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' 'http://localhost:8080/authorization/users'
```

and that he is Admin:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/users/BruceWayne'
```

```javascript
{
  "id": "BruceWayne",
  "name": "Bruce Wayne",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": [
    {
      "id": "132a2c88-3d00-43af-8318-540405874dfb",
      "name": "WayneManor admin",
      "version": "1"
    }
  ]
}
```

Note that 'WayneManor admin' is an internal Udaru policy, you can view it as follows: 

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/policies'
```

* Create users

As Bruce Wayne, let's create some more users:

```shell
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"id":"Alfred","name":"Alfred the butler"}' 'http://localhost:8080/authorization/users'

curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"id":"Joker","name":"The Joker"}' 'http://localhost:8080/authorization/users'

```

At this point, Alfred has been created, but is not in a team nor does he have any policies:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/users/Alfred'
```

```javascript
{
  "id": "Alfred",
  "name": "Alfred the butler",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": []
}
```

* Create some policies:

In Udaru you first create Policies and then attach does Policies to Users or Teams. 

First, you can verify that WayneManor has no Policies:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' 'http://localhost:8080/authorization/organizations/WayneManor'
```

Let's create a Policy to allow entry to the Bat Cave. Note that this is for demo purposes only, Policies should not be created directly in this way! In a real system, creating policies must be done with extreme caution - static policies will be seeded in Udaru at creation time, and dynamically created policies will be created by trusted back end services. Users must never be able to create Policies directly themselves. So for this demo: 

* calls to /authorization/policies are protected endpoints, we must pass the service key ('123456789' by default)
* you must also be an Udaru super user to call this directly

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"AccessBatCave","name":"batcave","version":"1","statements":{"Statement":[{"Effect":"Allow","Action":["enter","exit"],"Resource":["/waynemanor/batcave"],"Sid":"1","Condition":{}}]}}' 'http://localhost:8080/authorization/policies?sig=123456789'
```

We can verify this now exists:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/policies'
```

```javascript
..
{
  "id": "AccessBatCave",
  "version": "1",
  "name": "batcave",
  "statements": {
    "Statement": [
      {
        "Sid": "1",
        "Action": [
          "enter",
          "exit"
        ],
        "Effect": "Allow",
        "Resource": [
          "/waynemanor/batcave"
        ],
        "Condition": {}
      }
    ]
  }
}
..
```

* Associate our new Policy ('AccessBatCave') with a user (Alfred)

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"policies":["AccessBatCave"]}' 'http://localhost:8080/authorization/users/Alfred/policies'
```

Again we can verify this Policy has been added: 

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/users/Alfred'
```

```javascript
{
  "id": "Alfred",
  "name": "Alfred the butler",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": [
    {
      "id": "AccessBatCave",
      "name": "batcave",
      "version": "1"
    }
  ]
}
```

* Verify that Alfred can enter the Bat Cave:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/access/Alfred/enter/{/waynemanor/batcave}'
```

```javascript
{
  "access": true
}
```

TODO - the swagger for the above doesn't work! - something odd about the {resource*}
http://localhost:8080/documentation#!/authorization/getAuthorizationAccessUseridActionResource

* List all the actions Alfred can do in the Bat Cave:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/list/Alfred/{/waynemanor/batcave}'
```

```javascript
{
  "actions":["enter","exit"]
}
```

TODO - keep going with this example, create teams, etc.
