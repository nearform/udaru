# Example API Usage

The following is a highly contrived example usage of the Udaru Management and Authorizations APIs. The curl commands below are provided as examples only; we do not recommend you do this in any real world platform :-)

To follow along below, start by running Udaru locally as described in the [ReadMe](https://github.com/nearform/udaru/), and seed Udaru by running:

```
npm run pg:init
```

That will create the initial tables and ROOTid user used in the examples below.

Note that it's also possible to follow the example below using the live Swagger UI, also as described in the [ReadMe](https://github.com/nearform/udaru).

## Wayne Manor Example

*   Create a 'Wayne Manor Organization' to manage authorization to Batmans stuff, with 'Bruce Wayne' as the root owner:

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

```javascript
..
  {
      "name": "Wayne Manor",
      "description": "Wayne Manor Organisation"
  }
..
```

and also verify our 'Bruce Wayne' user exists with:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' 'http://localhost:8080/authorization/users'
```

```javascript
{
  "page": 1,
  "limit": 100,
  "total": 1,
  "data": [
    {
      "name": "Bruce Wayne",
      "organizationId": "WayneManor"
    }
  ]
}
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
      "version": "1",
      "variables": {}
    }
  ]
}
```

Note that 'WayneManor admin' is an internal Udaru policy, you can view it as follows: 

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/policies'
```

*   Create users

As Bruce Wayne, let's create some more users:

```shell
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"id":"Alfred","name":"Alfred the butler"}' 'http://localhost:8080/authorization/users'
```

```javascript
{
  "name": "Alfred the butler",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": []
}
```

```shell
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"id":"Joker","name":"The Joker"}' 'http://localhost:8080/authorization/users'
```

```javascript
{
  "name": "The Joker",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": []
}
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

*   Create some policies:

In Udaru you first create Policies and then attach does Policies to Users or Teams. 

First, you can verify that WayneManor has no Policies:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' 'http://localhost:8080/authorization/organizations/WayneManor'
```

Let's create a Policy to allow entry to the Bat Cave. Note that this is for demo purposes only, Policies should not be created directly in this way! In a real system, creating policies must be done with extreme caution - static policies will be seeded in Udaru at creation time, and dynamically created policies will be created by trusted back end services. Users must never be able to create Policies directly themselves. So for this demo: 

*   calls to /authorization/policies are protected endpoints, we must pass the service key ('123456789' by default)
*   you must also be an Udaru super user to call this directly

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

*   Associate our new Policy ('AccessBatCave') with a user (Alfred)

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"policies":[{"id": "AccessBatCave"}]}' 'http://localhost:8080/authorization/users/Alfred/policies'
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
      "version": "1",
      "variables": {}
    }
  ]
}
```

*   Verify that Alfred can enter the Bat Cave:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/access/Alfred/enter/{/waynemanor/batcave}'
```

```javascript
{
  "access": true
}
```

*   List all the actions Alfred can do in the Bat Cave:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/list/Alfred/{/waynemanor/batcave}'
```

```javascript
{
  "actions":["enter","exit"]
}
```

Let's list the actions Alfred can perform on a number of resources. First we'll need to create some extra policies.

*   Create a policy that allows the `Drive` action on the `batmobile`

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"DriveBatmobile","name":"batmobile","version":"1","statements":{"Statement":[{"Effect":"Allow","Action":["drive"],"Resource":["/waynemanor/batmobile"],"Sid":"1","Condition":{}}]}}' 'http://localhost:8080/authorization/policies?sig=123456789'
```

*   Create a policy that explicitly denies the `login` action on the `batcomputer`

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"DenyBatcomputer","name":"batcomputer","version":"1","statements":{"Statement":[{"Effect":"Deny","Action":["login"],"Resource":["/waynemanor/batcomputer"],"Sid":"1","Condition":{}}]}}' 'http://localhost:8080/authorization/policies?sig=123456789'
```

*   Associate these new policies with Alfred:

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne'  -d '{"policies":[{"id": "DriveBatmobile"}, {"id": "DenyBatcomputer"}]}' 'http://localhost:8080/authorization/users/Alfred/policies'
```

*   Once more, verify the policies are associated with Alfred:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne'  'http://localhost:8080/authorization/users/Alfred'
```

```js
{
  "id": "Alfred",
  "name": "Alfred the butler",
  "organizationId": "WayneManor",
  "teams": [],
  "policies": [
    {
      "id": "AccessBatCave",
      "name": "batcave",
      "version": "1",
      "variables": {}
    },
    {
      "id": "DenyBatcomputer",
      "name": "batcomputer",
      "version": "1",
      "variables": {}
    },
    {
      "id": "DriveBatmobile",
      "name": "batmobile",
      "version": "1",
      "variables": {}
    }
  ]
}
```

*   Now, let's list the actions Alfred can perform on the `batcave`, the `batmobile` and the `batcomputer` resources.

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/list/Alfred?resources=/waynemanor/batcave&resources=/waynemanor/batmobile&resources=/waynemanor/batcomputer'
```

```js
[
  {
    "resource": "/waynemanor/batcave",
    "actions": [
      "enter",
      "exit"
    ]
  },
  {
    "resource": "/waynemanor/batmobile",
    "actions": [
      "drive"
    ]
  },
  {
    "resource": "/waynemanor/batcomputer",
    "actions": []
  }
]
```

## Teams

Now let's add some teams; lets create a `Justice Leage` team that has the following sub teams: `Amazons`, `Aliens`, `Atlantis` (yep, they do exist: [Justice_Leagues](https://en.wikipedia.org/wiki/Justice_Leagues))

Frist, let's list teams to make sure we don't already have any:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' --header 'org: WayneManor' 'http://localhost:8080/authorization/teams'

```

```js
{
  "page": 1,
  "limit": 100,
  "total": 0,
  "data": []
}
```

Create our `Justice League` team:

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"justice-league","name":"Justice League","description":"The Justice League"}' 'http://localhost:8080/authorization/teams'
```

Confirm it exists:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' --header 'org: WayneManor' 'http://localhost:8080/authorization/teams'

```

```js
{
  "page": 1,
  "limit": 100,
  "total": 1,
  "data": [
    {
      "id": "justice-league",
      "name": "Justice League",
      "description": "The Justice League",
      "path": "justice-league",
      "organizationId": "WayneManor",
      "usersCount": 0
    }
  ]
}
```

Let's create our team of `Amazons`:

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"amazons","name":"Amazons", "description":"The Justice League Amazons","metadata":{}}' 'http://localhost:8080/authorization/teams'
```

And nest it under the `Justice League` team:

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"parentId":"justice-league"}' 'http://localhost:8080/authorization/teams/amazons/nest'

```

Verify that `Amazons` is a nested team of `Justice League`:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' --header 'org: WayneManor' 'http://localhost:8080/authorization/teams/justice-league/nested'
```

```js
{
  "data": [
    {
      "id": "amazons",
      "name": "Amazons",
      "description": "The Justice League Amazons",
      "parentId": "justice-league",
      "path": "justice-league.amazons",
      "organizationId": "WayneManor",
      "usersCount": 0
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 100
}
```

Next, let's create a new user, `Wonder Woman`:

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne' -d '{"id":"wonder-woman","name":"Wonder Woman","metadata":{}}' 'http://localhost:8080/authorization/users'
```

And add her to the `Amazons` team:

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne' -d '{"users":["wonder-woman"]}' 'http://localhost:8080/authorization/teams/amazons/users'
```

Let's verify `Wonder Woman` is in the `Amazons` team:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: BruceWayne' --header 'org: WayneManor' 'http://localhost:8080/authorization/users/wonder-woman'
```

```js
{
  "id": "wonder-woman",
  "name": "Wonder Woman",
  "organizationId": "WayneManor",
  "metadata": {},
  "teams": [
    {
      "id": "amazons",
      "name": "Amazons"
    }
  ],
  "policies": []
}
```

Now let's create a policy that will allow access to the Amazons meeting room in the BatCave - note again as above, this is not the recommended way of creating policies!

```bash
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' -d '{"id":"AccessAmazonMeetingRoom","name":"amazon meeting room","version":"1","statements":{"Statement":[{"Effect":"Allow","Action":["enter","exit"],"Resource":["/waynemanor/batcave/amazon-meeting-room"],"Sid":"1","Condition":{}}]}}' 'http://localhost:8080/authorization/policies?sig=123456789'
```

And let's add this policy to the `Amazons` team:

```bash
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: BruceWayne' -d '{"policies":[{"id": "AccessAmazonMeetingRoom"}]}' 'http://localhost:8080/authorization/teams/amazons/policies'
```

```js
{
  "id": "amazons",
  "name": "Amazons",
  "description": "The Justice League Amazons",
  "path": "justice-league.amazons",
  "organizationId": "WayneManor",
  "metadata": {},
  "users": [
    {
      "id": "wonder-woman",
      "name": "Wonder Woman"
    }
  ],
  "policies": [
    {
      "id": "AccessAmazonMeetingRoom",
      "name": "amazon meeting room",
      "version": "1",
      "variables": {}
    }
  ],
  "usersCount": 1
}
```

Let's see what Actions `Wonder Woman` can perform on `/waynemanor/batcave/amazon-meeting-room`:

```bash
curl -X GET --header 'Accept: application/json' --header 'authorization: ROOTid' --header 'org: WayneManor' 'http://localhost:8080/authorization/list/wonder-woman?resources=%2Fwaynemanor%2Fbatcave%2Famazon-meeting-room'
```

```js
[
  {
    "resource": "/waynemanor/batcave/amazon-meeting-room",
    "actions": [
      "enter",
      "exit"
    ]
  }
]
```
 