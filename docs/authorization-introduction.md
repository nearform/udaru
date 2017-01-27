# Authorization Introduction

This document provides a general overview on what are the terms used in the Udaru authorization system and describes the structure and functionality of the authorization application.

The Udaru authorization system has two main functional components:
- Using the PBAC authorization mechanism for internal use to authorize the system internal parts against themselves,
- Provide PBAC authorization service for external applications.

## Authorization terms

The access control management evolved from the need to mitigate the risk of unauthorized access to data.

Several control models were built during time to approach the various access control needs: Access Control Lists, Role Based Access Control, Attribute Based Access Control, Policy Based Access Control, Risk Adaptive Access Control. A summary of these models is made on [Survey on access control models][], the document offers a description of the PBAC model that Udaru uses.

Udaru is based on the [node-pbac][] module, module that as the developer claims is inspired and mostly compatible with the [AWS IAM][] policy engine.

Altough the [AWS IAM Policy][] is not the documentation for [node-pbac][] it can be used as reference for details regarding policies and policy elements.

## The Authorization model

An access control model can be built using the **Organization**, **Team** and **User** entities. The Organizations can have Teams or Users attached to them. Teams can have sub Teams or Users attached to them. Only the Team elements can have Team elements (sub Teams) attached to it.

Policies can be attached to Organizations, Teams and Users. The policy engine evaluates all policies from all levels when establishing if a User can perform an Action over a Resource.

**Important note:** Teams, Users and Policies can't be shared across Organizations.

A policy is a document that describes what type of access the policy owner has to a resource or a group of resources. Given the policies, the action to perform and a resource, the engine returns `true` if the action is authorized, `false` otherwise.

A User can have policies attached to himself or inherit them from his Team(s) and Organization.

A policy looks like:

```javascript
{
  id: 'Policy ID',
  version: '2016-07-01',
  name: 'Policy name',
  statements: { Statement: [{
    Effect: 'Allow',
    Action: ['Documents:Read'],
    Resource: ['wonka:documents:/public/*']
  }] }
}
```

The main elements of a policy are:
- The policy ID,
- The policy version,
- The policy name,
- The policy statements that contains an array of statements.

The elements of a Statement are:
- The Action to be performed. Example: `'authorization:teams:create'` or `'authorization:organizations:*'`,
- The Resource on which the action is performed. Example: `'FOO:orga:CLOUDCUCKOO:scenario:*:entity:north-america-id'`,
- The Effect - has the value 'Allow' or the value 'Deny'.

Wildcards can be used in Action and Resource names.

## The authorization system structure

The Udaru authorization system uses the same PBAC approach to perform administration of its internal resources as it does for controlling access to external resources. More details can be seen on [Authorization Technical Specs][]

The exposed functionality endpoints are structured as the following:
- Routes used to validate or not if actions over resources are authorized, these are exposed as [Public routes][],
- [Private routes][] are routes that can be accessed only through a **Service Key** that is passed as a query string in the form `sig=<key>`. The **Service Key** is loaded by Udaru from the config file. These private routes provide functionality to create, update and delete policies,
- Routes to access and manage the Organizations, Teams, Users and Policies hierarchies are exposed as [Public routes][].

## Routes in stand-alone server and Hapijs plugin modes

Each endpoint exposed by Udaru (when used as a server or as a hapi.js plugin) has an Action and a Resource associated with it. To perform a call to a certain endpoint the caller needs to have policies attached that allow him to do that specific action on that specific resource. This is the middleware access control level.

The endpoints that have no Resources explicitly written are detecting the associated Resource from the route structure.

Example for the authorize user endpoint '/authorization/access/{userId}/{action}/{resource*}':
```javascript
  config: {
    plugins: {
      auth: {
        action: 'authorization:authn:access',
        resource: 'authorization/access'
      }
    },
  ...
```
This endpoint has attached to it an action of type `authorization:authn:access` and it represents an `authorization/access` resource.

Example for the get user by id endpoint `/authorization/users/{id}/policies`:
```javascript
  plugins: {
    auth: {
      action: 'authorization:users:policy:add',
      getParams: (request) => ({ userId: request.params.id })
    }
  },
```
The endpoint has attached to it an action `authorization:users:policy:add` and its resource is detected from the route structure.

## Authorization for external applications

After Udaru has an Organization with Teams, Users and attached Policies structure defined its `/authorization/access/{userId}/{action}/{resource*}` endpoint can be used to check if an user is authorized to perform a certain action against a resource.

The external application works with Udaru by attaching to all endpoint requests an User ID. The User ID must be passed in the http headers as the `authorization` field. Internally knowing the User ID, Udaru retrieves data about the User like Organization ID to which the user belongs to, Teams to which the User belongs to and Policies attached to it or its parent hierarchy elements. The retrieved data is used at middleware level to authoriza the User to access the endpoint and then evaluate the endpoint request (to manage the authorization model or to check if an Action can be performed over a Resource).

Example:
```javascript
curl -X GET --header 'Accept: application/json' --header 'authorization: <UserID>' 'http://localhost:8080/authorization/organizations'
```

Another header field that can be used only by Super Users is the `org` field. This is used for impersonating the organization as if that Super User belongs to that organization.

Example:
```javascript
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTID' --header 'org: WONKA' -d '{"policies":["PolicyID"]}' 'http://localhost:8080/authorization/teams/TeamID/policies'
```


[iam-js]: https://github.com/nearform/iam-js
[node-pbac]: https://github.com/monken/node-pbac
[AWS IAM]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html
[AWS IAM Policy]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
[Authorization Technical Specs]: ./docs/reference/spec.md
[Private routes]: ./lib/plugin/routes/private
[Public routes]: ./lib/plugin/routes/public
[Survey on access control models]: http://csrc.nist.gov/news_events/privilege-management-workshop/PvM-Model-Survey-Aug26-2009.pdf
