'use strict'

const Joi = require('joi')

const requiredString = Joi.string().required()
const requiredStringId = Joi.string().regex(/^[A-Za-z0-9-]+$/).required().max(128)
const MetaData = Joi.object().optional().description('Metadata').label('MetaData')

const PolicyIdString = requiredStringId.description('Policy Id String').label('PolicyIdString')
const PolicyVariables = Joi.object().optional().pattern(/^(?!(udaru)|(request)).*$/igm, requiredString).description('A list of the variables with their fixed values').label('variables')
const PolicyInstanceId = Joi.number().integer().optional().description('Optional Policy Instance Id')

const PolicyIdObject = Joi.object({
  id: PolicyIdString,
  variables: PolicyVariables,
  instance: PolicyInstanceId
}).description('Policy Id Object').label('PolicyIdObject')

const resource = requiredString.description('A resource to act upon').label('resource string')
const action = requiredString.description('The action to check against a resource').label('action string')
const effect = Joi.string().valid('Allow', 'Deny').label('Effect')
const condition = Joi.object().label('Condition operator used when evaluating effect')
const ResourceBatch = Joi.array().min(1).items(Joi.object({
  resource: resource,
  action: action
}).label('ResourceAccess')).required().description('A batch of resources and actions to check').label('ResourceBatch')

const PolicyIdsArray = Joi.array().required().items(PolicyIdObject).description('Array of Policies/Policy Templates to associate with this entity (with optional Policy Instance variables)').label('PolicyIdsArray')
const UsersArray = Joi.array().required().items(requiredString).description('User IDs').label('UsersArray')
const TeamsArray = Joi.array().required().items(requiredString).description('Teams IDs').label('TeamsArray')
const ResourcesArray = Joi.array().items(resource.description('A single resource')).single().required().description('A list of Resources').label('ResourcesArray')

const StatementObject = Joi.object({
  Effect: effect,
  Action: Joi.array().min(1).items(action).label('Action'),
  Resource: Joi.array().min(1).items(resource).label('Resource'),
  Sid: Joi.string().label('Sid'),
  Condition: condition
}).label('StatementObject')

const StatementsArray = Joi.array().min(1).items(StatementObject).label('StatementsArray')

const StatementsObject = Joi.object({
  Statement: StatementsArray
}).required().label('StatementsObject')

const validationRules = {
  name: requiredString.description('Name'),
  userName: requiredString.max(255).description('Name'),
  teamName: requiredString.max(30).description('Name'),
  policyName: requiredString.max(64).description('Name'),
  organizationName: requiredString.max(64).description('Name'),
  description: requiredString.description('Description'),
  metadata: MetaData,
  userId: requiredStringId.description('User ID'),
  teamId: requiredStringId.description('Team ID'),
  organizationId: requiredStringId.description('Organization ID'),
  policyInstance: PolicyInstanceId,
  page: Joi.number().integer().min(1).description('Page number, starts from 1'),
  limit: Joi.number().integer().min(1).description('Items per page'),
  version: requiredString.description('Version number'),

  user: Joi.object({
    id: Joi.string().description('User ID'),
    name: requiredString.description('User name')
  }).label('UserPayload'),

  parentId: Joi.string().description('Parent ID'),
  policyId: requiredStringId.description('Policy ID'),

  users: UsersArray,
  policies: PolicyIdsArray,
  teams: TeamsArray,
  resource: resource,
  action: action,
  resources: ResourcesArray,
  resourceBatch: ResourceBatch,
  statements: StatementsObject
}

const users = {
  listOrgUsers: {
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  readUser: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  createUser: {
    id: validationRules.userId.optional(),
    name: validationRules.userName,
    organizationId: validationRules.organizationId,
    metadata: validationRules.metadata
  },
  deleteUser: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  updateUser: {
    id: validationRules.userId,
    name: validationRules.userName,
    organizationId: validationRules.organizationId,
    metadata: validationRules.metadata
  },
  replaceUserPolicies: {
    id: validationRules.userId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  addUserPolicies: {
    id: validationRules.userId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  amendUserPolicies: {
    id: validationRules.userId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  deleteUserPolicies: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  deleteUserPolicy: {
    userId: validationRules.userId,
    policyId: validationRules.policyId,
    organizationId: validationRules.organizationId,
    instance: validationRules.policyInstance
  },
  listUserTeams: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId,
    page: validationRules.page,
    limit: validationRules.limit
  },
  listUserPolicies: {
    id: validationRules.teamId,
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  replaceUserTeams: {
    id: validationRules.userId,
    teams: validationRules.teams,
    organizationId: validationRules.organizationId
  },
  deleteUserFromTeams: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  searchUser: {
    organizationId: validationRules.organizationId,
    query: requiredString
  }
}

const teams = {
  listOrgTeams: {
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  listNestedTeams: {
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId,
    id: validationRules.teamId
  },
  createTeam: {
    id: validationRules.teamId.optional().description('The ID to be used for the new team. Only alphanumeric characters and underscore are supported'),
    parentId: validationRules.teamId.optional().allow(null),
    name: validationRules.teamName,
    user: validationRules.user,
    description: validationRules.description,
    organizationId: validationRules.organizationId,
    metadata: validationRules.metadata
  },
  readTeam: {
    id: validationRules.teamId,
    organizationId: validationRules.organizationId
  },
  updateTeam: {
    id: validationRules.teamId,
    name: validationRules.teamName.optional(),
    description: validationRules.description.optional(),
    organizationId: validationRules.organizationId,
    metadata: validationRules.metadata
  },
  deleteTeam: {
    id: validationRules.teamId,
    organizationId: validationRules.organizationId
  },
  moveTeam: {
    id: validationRules.teamId,
    parentId: validationRules.parentId,
    organizationId: validationRules.organizationId
  },
  addTeamPolicies: {
    id: validationRules.teamId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  amendTeamPolicies: {
    id: validationRules.teamId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  replaceTeamPolicies: {
    id: validationRules.teamId,
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  deleteTeamPolicies: {
    id: validationRules.teamId,
    organizationId: validationRules.organizationId
  },
  deleteTeamPolicy: {
    teamId: validationRules.teamId,
    policyId: validationRules.policyId,
    organizationId: validationRules.organizationId,
    instance: validationRules.policyInstance
  },
  readTeamUsers: {
    id: validationRules.teamId,
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  listTeamPolicies: {
    id: validationRules.teamId,
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  addUsersToTeam: {
    id: validationRules.teamId,
    users: validationRules.users,
    organizationId: validationRules.organizationId
  },
  replaceUsersInTeam: {
    id: validationRules.teamId,
    users: validationRules.users,
    organizationId: validationRules.organizationId
  },
  deleteTeamMembers: {
    id: validationRules.teamId,
    organizationId: validationRules.organizationId
  },
  deleteTeamMember: {
    id: validationRules.teamId,
    userId: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  searchTeam: {
    organizationId: validationRules.organizationId,
    query: requiredString,
    type: Joi.string().optional().allow('default', 'exact')
  },
  searchTeamUsers: {
    organizationId: validationRules.organizationId,
    query: requiredString,
    id: validationRules.teamId
  }
}

const policies = {
  listByOrganization: {
    organizationId: validationRules.organizationId,
    page: validationRules.page,
    limit: validationRules.limit
  },
  readPolicy: {
    id: validationRules.policyId,
    organizationId: validationRules.organizationId
  },
  readPolicyVariables: {
    id: validationRules.policyId,
    organizationId: validationRules.organizationId,
    type: Joi.string().optional().allow('shared', 'organization').description('Flag to denote policy type, defaults to organization')
  },
  listPolicyInstances: {
    id: validationRules.policyId,
    organizationId: validationRules.organizationId,
    type: Joi.string().optional().allow('shared', 'organization').description('Flag to denote policy type, defaults to organization')
  },
  createPolicy: {
    id: validationRules.policyId.allow('').optional(),
    version: validationRules.version,
    name: validationRules.policyName,
    organizationId: validationRules.organizationId,
    statements: validationRules.statements
  },
  updatePolicy: {
    id: validationRules.policyId,
    organizationId: validationRules.organizationId,
    version: validationRules.version,
    name: validationRules.policyName,
    statements: validationRules.statements
  },
  deletePolicy: {
    id: validationRules.policyId,
    organizationId: validationRules.organizationId
  },
  listSharedPolicies: {
    page: validationRules.page,
    limit: validationRules.limit
  },
  readSharedPolicy: {
    id: validationRules.policyId
  },
  createSharedPolicy: {
    id: validationRules.policyId.allow('').optional(),
    version: validationRules.version,
    name: validationRules.policyName,
    statements: validationRules.statements
  },
  deleteSharedPolicy: {
    id: validationRules.policyId
  },
  updateSharedPolicy: {
    id: validationRules.policyId,
    version: validationRules.version,
    name: validationRules.policyName,
    statements: validationRules.statements
  },
  searchPolicy: {
    organizationId: validationRules.organizationId,
    query: requiredString,
    type: Joi.string().optional().allow('shared', 'organization', 'all').description('Flag to denote search for shared policy, defaults to organization wide search')
  }
}

const organizations = {
  list: {
    page: validationRules.page,
    limit: validationRules.limit
  },
  readById: validationRules.organizationId,
  create: {
    id: validationRules.organizationId.optional(),
    name: validationRules.organizationName,
    description: validationRules.description,
    metadata: validationRules.metadata,
    user: validationRules.user
  },
  deleteById: validationRules.organizationId,
  update: {
    id: validationRules.organizationId,
    name: validationRules.organizationName,
    description: validationRules.description,
    metadata: validationRules.metadata
  },
  addOrganizationPolicies: {
    id: validationRules.organizationId,
    policies: validationRules.policies
  },
  amendOrganizationPolicies: {
    id: validationRules.organizationId,
    policies: validationRules.policies
  },
  replaceOrganizationPolicies: {
    id: validationRules.organizationId,
    policies: validationRules.policies
  },
  deleteOrganizationPolicies: {
    id: validationRules.organizationId
  },
  deleteOrganizationPolicy: {
    id: validationRules.organizationId,
    policyId: validationRules.policyId,
    instance: validationRules.policyInstance
  },
  listOrganizationPolicies: {
    id: validationRules.teamId,
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  }
}

const authorize = {
  isUserAuthorized: {
    userId: validationRules.userId,
    action: validationRules.action,
    resource: validationRules.resource,
    organizationId: validationRules.organizationId
  },
  batchAuthorization: {
    userId: validationRules.userId,
    resourceBatch: validationRules.resourceBatch,
    organizationId: validationRules.organizationId
  },
  listAuthorizations: {
    userId: validationRules.userId,
    resource: validationRules.resource,
    organizationId: validationRules.organizationId
  },
  listAuthorizationsOnResources: {
    userId: validationRules.userId,
    resources: validationRules.resources,
    organizationId: validationRules.organizationId
  }
}

// swagger stuff from here...
const PolicyStatements = Joi.object({
  Statement: Joi.array().items(Joi.object({
    Effect: effect,
    Action: Joi.array().items(action).description('Action to perform on resource').label('Actions'),
    Resource: Joi.array().items(resource).description('Resource that the statement covers').label('Resources'),
    Sid: Joi.string().description('Statement ID').label('Sid'),
    Condition: condition
  }).label('Statement')).label('Statements')
}).label('PolicyStatements')

const Policy = Joi.object({
  id: Joi.string().description('Policy ID'),
  version: Joi.string().description('Policy version'),
  name: Joi.string().description('Policy name'),
  statements: PolicyStatements
}).label('Policy')
const Policies = Joi.array().items(Policy).description('items').label('Policies')

const PolicyRef = Joi.object({
  id: Joi.string().description('Policy ID'),
  version: Joi.string().description('Policy version'),
  name: Joi.string().description('Policy name'),
  variables: Joi.object().description('List of fixed values for variables').label('Variables'),
  instance: Joi.number().integer().description('Policy unique instance')
}).label('PolicyRef')
const PolicyRefs = Joi.array().items(PolicyRef).description('Policy Refs').label('PolicyRefs')

const PolicyInstance = Joi.object({
  entityType: Joi.string().optional().allow('organization', 'team', 'user').description('The type of entity this policy is assigned to'),
  entityId: Joi.string().optional('The id of the entity this policy is assigned to'),
  variables: Joi.object().description('List of fixed values for variables').label('Variables'),
  instance: Joi.number().integer().description('Policy unique instance')
}).label('PolicyInstance')
const PolicyInstances = Joi.array().items(PolicyInstance).description('Policy Instances').label('Policy Instances')

const PolicyTemplateVariables = Joi.array().items(Joi.string()).description('Policy Template Variable Placeholders').label('Policy Template Variables')

const UserRef = Joi.object({
  id: Joi.string().description('User ID'),
  name: Joi.string().description('User name')
}).label('UserRef')
const UserRefs = Joi.array().items(UserRef).description('User refs').label('UserRefs')

const TeamRef = Joi.object({
  id: Joi.string().description('Team ID'),
  name: Joi.string().description('Team name')
}).label('TeamRef')
const TeamRefs = Joi.array().items(TeamRef).description('Team refs').label('TeamRefs')

const ShortTeam = Joi.object({
  id: Joi.string().description('Team ID'),
  name: Joi.string().description('Team name'),
  description: Joi.string().description('Team description'),
  path: Joi.string(),
  organizationId: Joi.string().description('Organization ID to which the team belongs to')
}).label('Short Team')

const Team = Joi.object({
  id: Joi.string().description('Team ID'),
  name: Joi.string().description('Team name'),
  description: Joi.string().description('Team description'),
  path: Joi.string(),
  metadata: MetaData,
  users: UserRefs,
  policies: PolicyRefs,
  organizationId: Joi.string().description('Organization ID to which the team belongs to'),
  usersCount: Joi.number().description('Number of team users. Sub team users not counted.')
}).label('Team')

const Teams = Joi.array().items(Team).description('items').label('Teams')

const NestedTeam = Joi.object({
  id: Joi.string().description('Team ID'),
  name: Joi.string().description('Team name'),
  description: Joi.string().description('Team description'),
  parentId: Joi.string().description('Parent Team ID'),
  path: Joi.string(),
  organizationId: Joi.string().description('Organization ID to which the team belongs to'),
  usersCount: Joi.number().description('Number of team users. Sub team users not counted.')
}).label('Nested Team')

const NestedTeams = Joi.array().items(NestedTeam).description('items').label('Nested Teams')

const User = Joi.object({
  id: Joi.string().description('User ID'),
  name: Joi.string().description('User name'),
  organizationId: Joi.string().description('Organization ID to which the user belongs to'),
  metadata: MetaData,
  teams: TeamRefs,
  policies: PolicyRefs
}).label('User')
const Users = Joi.array().items(User).description('items').label('Users')

const Organization = Joi.object({
  id: Joi.string().description('Organization ID'),
  name: Joi.string().description('Organization name'),
  description: Joi.string().description('Organization description'),
  metadata: MetaData,
  policies: PolicyRefs
}).label('Organization')
const Organizations = Joi.array().items(Organization).description('items').label('Organizations')

const OrganizationAndUser = Joi.object({
  organization: Organization,
  user: UserRef
}).label('OrganizationAndUser')

const List = (data) => {
  return Joi.object({
    page: Joi.number().integer().min(1).description('Page number, starts from 1'),
    limit: Joi.number().integer().min(1).description('Items per page'),
    total: Joi.number().integer().description('Total number of entries matched by the query'),
    data: data
  }).label('PagedList')
}

const PagedPolicies = List(Policies).label('PagedPolicies')
const PagedPolicyRefs = List(PolicyRefs).label('PagedPolicyRefs')
const PagedTeams = List(Teams).label('PagedTeams').description('Note: teams users and policies are not populated in paged teams list')
const NestedPagedTeams = List(NestedTeams).label('NestedPagedTeams').description('Note: teams users and policies are not populated in nested paged teams list')
const PagedTeamRefs = List(TeamRefs).label('PagedTeamRefs')
const PagedUsers = List(Users).label('PagedUsers')
const PagedOrganizations = List(Organizations).label('PagedOrganizations')

const Search = (data) => {
  return Joi.object({
    total: Joi.number().integer().description('Total number of entries matched by the query'),
    data: Joi.array().items(data).label('Data')
  }).label('SearchList')
}

const SearchUser = Joi.object({
  total: Joi.number().integer().description('Total number of entries matched by the query'),
  data: Users
}).label('SearchUserList')

const Access = Joi.object({
  access: Joi.boolean()
}).label('Access')

const UserActionsArray = Joi.array().items(Joi.string()).label('UserActionsArray')

const UserActions = Joi.object({
  actions: UserActionsArray
}).label('UserActions')

const UserActionsOnResources = Joi.array().items(Joi.object({
  resource: Joi.string().label('UserResource'),
  actions: UserActionsArray
}).label('UserActionOnResource')).label('UserActionsOnResources')

const BatchAccess = Joi.array().items(Joi.object({
  resource: resource,
  action: action,
  access: Joi.boolean()
}).label('BatchAccess')).description('Array to determine if a user has access to perform actions on resources').label('BatchAccessList')

const swagger = {
  List,
  User,
  UserActions,
  UserActionsOnResources,
  Team,
  NestedTeam,
  TeamRef,
  Policy,
  PagedPolicies,
  PagedTeams,
  NestedPagedTeams,
  PagedTeamRefs,
  PagedUsers,
  PagedOrganizations,
  PolicyRef,
  PolicyRefs,
  PolicyInstance,
  PolicyInstances,
  PagedPolicyRefs,
  Organization,
  OrganizationAndUser,
  PolicyStatements,
  PolicyTemplateVariables,
  Access,
  BatchAccess,
  Search,
  SearchUser,
  ShortTeam
}

module.exports = {
  users,
  teams,
  policies,
  organizations,
  authorize,
  swagger
}
