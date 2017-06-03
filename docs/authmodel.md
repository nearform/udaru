# Examples of organization structures modeled with Udaru

Access to resources can be modeled in Udaru through the elements that it provides: Organizations, Teams, Users. Policies can be attached to any of these elements. For more details, see the [Udaru Introduction][].

The usual modeling case is to build independent organizations, each organization having teams (or nested teams) attached to them and users attached to teams. Policies are attached to Organizations, Teams or Users.

In the examples below in the **Cross organization access management** section it is described a particular case in which we need users that have access rights over several organizations. This corner case is not the perfect match for the Udaru architecture but it can be achieved using the shallow impersonation feature.

## Cross organization access management

This example describes how to model an organization in which it is needed to have users that have access rights over several organizations and have limited access rights on other organizations.

### Context

In Udaru all operations are performed in the organization context: for each user request Udaru finds the organization to which the user belongs to and from there all middleware checks and element queries are made in the organization context. One user can't perform operations outside the organization to which it belongs to. The user identifier is passed in the Http headers as the `authorization` field.

There is a special type of Udaru users, named SuperUsers, that belong to the 'ROOT' organization. SuperUsers can be assigned full access rights on all actions on all resources. To be able to do operations as SuperUser on an Organization, Udaru provides an impersonation functionality: by passing in the Http headers an 'org' field, the endpoint request is made as if the SuperUser belongs to the 'org' organization thus having acess to all the exposed Udaru functionality for that organization (like user management, team management).

curl impersonation example in which a SuperUser impersonates an user belonging to the `WONKA` organization:
```javascript
curl -X PUT --header 'Content-Type: application/json' --header 'Accept: application/json' --header 'authorization: ROOTID' --header 'org: WONKA' -d '{"policies":["PolicyID"]}' 'http://localhost:8080/authorization/teams/TeamID/policies'
```

### Needed model structure

The structure to be modeled is the following:

We have the default root organization on which we have two Teams. On the first team there are two users, on the 2nd team there is one user and the 4th user belongs to no team. All the 4 users belong to the root organization.
We plan to add to Team1 a set of policies so that the User1 and User2 have access to resources from Org1 and Org2, then assign to Team2 a set of policies so that User3 has access to Org3. User4 has no policies attached and has no access to any of the Organizations.

A visual representation of the structure:
```
  -------------------   --------   --------   --------
  |     rootOrg     |   | Org1 |   | Org2 |   | Org3 |
  -------------------   --------   --------   --------
     /        \   \
   Team1     Team2 \
   /   \       |    \
 User1 User2 User3  User4
```

### Solution

One **limitation** of this modelling approach is that we have to build the route access policies and also the resource access policies in the root organization so that they can be attached to the SuperUser teams. The policy management is made at the root organization level.

The structure is built like it is described in the previous section.
The organization endpoints access policies and organization resource access policies are attached to the two teams.

A fully working model sample can be seen in the [Full organization test file][] in "SuperUsers with limited access across organizations".

The policies built to configure access structure are of three types:
-   Access to organization management operations is given by attaching to the two root teams the default organization policies: `authorization:organizations:read` rights to be able to access the `/authorization/organizations/<orgId>` endpoint, `authorization:teams:*` rights to allow access to `/authorization/teams/*` endpoints, `authorization:users:*` rights to allow access to `/authorization/users/*` endpoints, `authorization:policies:list` rights to access the `/authorization/policies` endpoint, `authorization:policies:read` rights to access the `/authorization/policies/<policyId>` endpoint,
-   Access to the authorization check endpoint is given by attaching to teams a policy that gives `authorization:authn:access` rights to allow access on `/authorization/access/{userId}/{action}/{resource*}` endpoint,
-   Access to internal organization policies is given by defining specific internal organization actions and resources.

[Udaru Introduction]: authorization-introduction.md
[Full organization test file]: ../test/integration/endToEnd/fullOrgStructure.test.js
