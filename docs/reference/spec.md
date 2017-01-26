# Authorization Tech Spec

Attempt at defining how the Authorization full stack component should work. For a general overview of PBAC access control, including Action, Resource & Policies, see: [iam-js](https://github.com/nearform/iam-js).

The Authorization component will use it's own authorization mechanism for administration of Organizations, Teams and Users. This document will focus on how Authorization itself should work when managing it's own internals; it does not cover how an Application will use the Authorization service.

The main roles for the core Administration are:

* SuperUser: can do anything and change anything, this is full access to all actions on all resouces.
* Organization Administrator: can do anything in an Organization, i.e. full access to all actions in their Organization resource.

## Actions & Resources

For both Actions and Resources we'll use a namespace called 'authorization'.

The following actions should cover the core Administrator functionality:

```
authorization:organization:create
authorization:organization:read
authorization:organization:update
authorization:organization:delete
authorization:organizations:list
authorization:team:create
authorization:team:read
authorization:team:update
authorization:team:delete
authorization:teams:list
authorization:user:create
authorization:user:read
authorization:user:update
authorization:user:delete
authorization:users:list
authorization:policies:list
authorization:policy:create
authorization:policy:read
authorization:policy:update
authorization:policy:delete

```

Note that Policies will never be created directly, i.e. there is no public api to create a policy, instead they are created in application logic. This is true for both Applications using Authorization service and also for the internal implementation of Authorization itself.

The Resource uri format proposed is as follows:

`authorization/<organization-id>/<team-id>/<user-id>`

e.g `authorization/foo-org-xyz` references the Foo Organization.

## Inception

The SuperUser is created at first install, this is simply a normal user with the SuperUser policy attached to it. This can be done be done at setup time in the simplest way we can. The SuperUser is responsible for creating new Organizations, and in particular an Organization Administrator (OrgAdmin) - someone in the Organization responsible for managing that Organization.

The SuperUser policy will look as follows, it simply allows all actions on all resources:

```
{
  Name: 'SuperUser',
  Version: '2106-10-17',
  Statement: [{
	Effect: 'Allow',
	Action: ['*'],
	Resource: ['*']
  }]
}
```

This policy can also be attached to other Users as and if required.

## Workflows

Pseudocode for some typical workflows:

### Organization Management

SuperUser logs in[1][2] and creates a new Organization[3][4], giving it a name and an OrgAdmin user. The backend logic then is as follows:

* lookup user and get all the Policies attached to the user
* check if any of the policies grant the user access to the 'authorization:organization:create' action on the 'authorization:' resource
* if it is the SuperUser, they will have the above Policy which will match, and hence they will be allowed to proceed
* an new Organization resource is created, returning the org-id
* a new User is created (or looked up if exists already, etc)
* a new OrgAdmin Policy is created for this new Organization, something like:

```
Action: ['authorization:organization:read', 'authorization:organization:update'],
Resource: ['authorization/<org-id>/*']
```

* this new Policy is associated with the user, who can henceforth perform OrgAdmin actions

Similar logic can be applied to listing, reading, deleting & updating Organizations by the SuperAdmin user.

- [1] https://github.com/nearform/labs-authorization/issues/27
- [2] https://github.com/nearform/labs-authorization/issues/14
- [3] https://github.com/nearform/labs-authorization/issues/2
- [4] https://github.com/nearform/labs-authorization/issues/62

### Team & User Management

OrgAdmin (somehow) logs in to the <org-id> (created above) and creates a new Team, giving it a name and possibly a TeamAdmin user also. The backend logic then is as follows:

* lookup user and get all the Policies attached to the user
* check if any of the policies grant the user access to the 'authorization:organization:team:create' action on the 'authorization:<org-id>' resource
* if it is the OrgAdmin user they will have the above policy attached and they will be allowed to proceed
* a new Team is created, returning the team-id
* If a user is passed then that user will become a TeamAdmin - unlike the Create Organization flow above, this may be optional
* a new User is created (or looked up if exists already, etc)
* a new TeamAdmin Policy is created for this new Team, something like:

```
Action: ['authorization:team:read', 'authorization:team:update'],
Resource: ['authorization/<org-id>/<team-id>/*']
```

* this new Policy is associated with the user, who can henceforth perform TeamAdmin actions

Similar logic can be applied to listing, reading, deleting & updating Team AND Users by the OrgAdmin user.

The exact actions a OrgAdmin & TeamAdmin can and cannot perform need to be explicitly defined and possibly even made configurable per Organization in the long run.

Note it may be necessary to facilitate Application specific Policies being attached to new Users and Teams when they are created. This facilitates developers easily attaching default policies to a User, e.g. ability to list and read 'public' resources, etc. How this happens exactly is up for debate (WebHooks, Pub/Sub or something). Probably out of scope for now.

### Application specific Policies

A set of stock Policies[1] will be created by the Application developers; these are general policies that govern basic user access to generic resources, e.g. a user can take any action on a resource they created, a user has readonly access to a certain number of 'public' resources, etc.

This initial set of Policies are all application specific, and again are created by developers at installation time. These are typically they are not surfaced as raw policies to the OrgAdmin and TeamAdmin users who will use the Applications Administration user interface, i.e. something like a 'CanReadResource' policy may be tick box that makes sense in the context of the Applications AdminUI.

However, the default Authorization interface should make it possible to list these policies and attach them to Teams/Users.

* an 'attach policy to team' request comes in
* lookup user (making the request) and get all the Policies attached to the user
* check if any of the policies grant the user access to the 'authorization:organization:team:update' action on the 'authorization/<org-id>/<team-id>' resource
* etc..


- [1] https://github.com/nearform/labs-authorization/issues/67

