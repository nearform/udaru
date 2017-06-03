
# Authorization Introduction

This document provides a general overview of the terms used in the Udaru authorization system, and also describes the structure and functionality of the authorization application.

Access control management evolved from the need to mitigate the risk of unauthorized access to data.

Several control models were built during time to approach the various access control needs: Access Control Lists, Role Based Access Control, Attribute Based Access Control, Policy Based Access Control, Risk Adaptive Access Control. A great summary of this evolution can be found is this [survey on access control models][]. This document offers a description of the PBAC model that Udaru uses.

Internally Udaru uses the [node-pbac][] module, which is inspired by (and mostly compatible with) the [AWS IAM][] policy engine.

Although the [AWS IAM Policy][] is not the documentation for [node-pbac][] it can be used as reference for details regarding policies and policy elements.

## The Authorization model

An access control model can be built using the **Organization**, **Team** and **User** entities. An Organization can contain Teams or Users, and Teams can contain other Teams or Users.

**Policies** can be attached to Teams, Users and Organizations. The policy engine evaluates all policies from all levels when establishing if a User can perform an Action on a Resource.

**Important note:** Teams, Users and Policies can't be shared across Organizations.

A policy is a document that describes the type of access that the policy owner has to a resource or a group of resources. Given the policies, the action to perform and a resource, the engine returns `true` if the action is authorized, `false` otherwise.

Users can have policies attached to themselves, or inherit them from their Team(s) and Organization.

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
-   The policy ID
-   The policy version
-   The policy name
-   The policy statements that contains an array of statements.

The main elements of a Statement are:
-   The Action to be performed. Example: `'authorization:teams:create'` or `'authorization:organizations:*'`
-   The Resource on which the action is performed. A Resource name is effectively a URI for your resources. Example: `'FOO:orga:CLOUDCUCKOO:scenario:*:entity:north-america-id'`
-   The Effect - has the value 'Allow' or 'Deny'.

Note that wildcards can be used in Action and Resource names, as can certain variables, see [IAM Policy Variables Overview][] for more details.

For a detailed description of Policies, see the [AWS Policy Elements Reference][].

## API

The Udaru API can be used directly as a normal node module, but also has a REST API (a Hapi plugin is provided), and it can also be used out of the box as a standalone server.

The API has a mix of public and private routes:

-   Routes that validate if actions on resources are authorized are exposed as [public routes][]
-   [private routes][] are routes that can be accessed only through a **Service Key**. These private routes provide functionality to create, update and delete policies.
-   Routes to access and manage the Organizations, Teams, Users and Policies hierarchies are exposed as [public routes][].

### REST API - Hapijs plugin

Each endpoint exposed by Udaru has an Action and a Resource associated with it. To perform a call to a certain endpoint the caller needs to have policies attached that allow them to perform that specific action on that specific resource. This is the middleware access control level.

The endpoints that have no Resources explicitly written are detecting the associated Resource from the route structure.

Example for the authorize user endpoint `'/authorization/access/{userId}/{action}/{resource*}'`:
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

## Client usage

When Udaru is seeded with Organizations, Teams, Users and attached Policies structure defined, client services can use the `access` API (`/authorization/access/{userId}/{action}/{resource*}`) endpoint to check if an user is authorized to perform a certain action on a resource.

The external application works with Udaru by attaching an User ID to all endpoint requests. The User ID must be passed in the http headers as the `authorization` field. Knowing the User ID, Udaru retrieves internally data about the User like:  Organization ID to which the user belongs to, Teams to which the User belongs to, Policies attached to it or its parent hierarchy elements. This data is used at middleware level to authorize the User to access the endpoint and then evaluate the endpoint request (to manage the authorization model or to check if an Action can be performed over a Resource).

Example:
```javascript
curl -X GET --header 'Accept: application/json' --header 'authorization: <UserID>' 'http://localhost:8080/authorization/organizations'
```

Another header field that can be used only by Super Users is the `org` field. This is used to obtain a shallow impersonation. It will substitute the organization ID so that the Super Admin can perform operations in any organization.

Example:
```javascript
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTID' --header 'org: WONKA' -d '{"policies":["PolicyID"]}' 'http://localhost:8080/authorization/teams/TeamID/policies'
```

[node-pbac]: https://github.com/monken/node-pbac
[AWS IAM]: https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html
[AWS IAM Policy]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
[AWS Policy Elements Reference]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
[IAM Policy Variables Overview]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_variables.html
[private routes]: ../lib/plugin/routes/private
[public routes]: ../lib/plugin/routes/public
[survey on access control models]: http://csrc.nist.gov/news_events/privilege-management-workshop/PvM-Model-Survey-Aug26-2009.pdf
