'use strict'

const Joi = require('joi')

const requiredString = Joi.string().required()
const requiredStringId = Joi.string().required().max(128)
const MetaData = Joi.object().optional().description('Metadata').label('MetaData')

const PolicyIdString = requiredStringId.description('Policy Id String').label('PolicyIdString')

const PolicyIdObject = Joi.object({
  id: PolicyIdString,
  variables: Joi.object().pattern(/^(?!(udaru)|(request)).*$/igm, requiredString).description('A list of the variables with their fixed values').label('variables')
}).required().description('Policy Id Object').label('PolicyIdObject')

// it would be ideal to put the policyid object first, however it causes a swagger doc error
// as swagger cannot interpret alternatives
const requiredPolicy = Joi.alternatives().try([
  PolicyIdString,
  PolicyIdObject
]).description('Policy ID object ({id, variables}) OR Policy ID string').label('RequiredPolicy')

const PolicyIdsArray = Joi.array().required().items(requiredPolicy).description('Array of Policy ID Objects {id, variables} OR Policy ID strings').label('PolicyIdsArray')
const UsersArray = Joi.array().required().items(requiredString).description('User IDs').label('UsersArray')
const TeamsArray = Joi.array().required().items(requiredString).description('Teams IDs').label('TeamsArray')
const ResourcesArray = Joi.array().items(requiredString.description('A single resource')).single().required().description('A list of Resources').label('ResourcesArray')

const StatementObject = Joi.object({
  Effect: Joi.string().valid('Allow', 'Deny').label('Effect'),
  Action: Joi.array().min(1).items(Joi.string()).label('Action'),
  Resource: Joi.array().min(1).items(Joi.string()).label('Resource'),
  Sid: Joi.string().label('Sid'),
  Condition: Joi.object().label('Condition')
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
  policyInstance: Joi.number().integer().optional().description('Policy Instance Id'),
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
  resources: ResourcesArray,
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
    id: Joi.string().regex(/^[0-9a-zA-Z_]+$/).max(128).description('The ID to be used for the new team. Only alphanumeric characters and underscore are supported'),
    parentId: validationRules.teamId.optional().allow(null),
    name: validationRules.teamName,
    description: validationRules.description,
    user: validationRules.user,
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
    query: requiredString
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
  replaceOrganizationPolicies: {
    id: validationRules.organizationId,
    policies: validationRules.policies.min(1)
  },
  deleteOrganizationPolicies: {
    id: validationRules.organizationId
  },
  deleteOrganizationPolicy: {
    id: validationRules.organizationId,
    policyId: validationRules.policyId,
    instance: validationRules.policyInstance
  }
}

const authorize = {
  isUserAuthorized: {
    userId: validationRules.userId,
    action: requiredString.description('The action to check'),
    resource: requiredString.description('The resource that the user wants to perform the action on'),
    organizationId: validationRules.organizationId
  },
  listAuthorizations: {
    userId: validationRules.userId,
    resource: requiredString.description('The resource that the user wants to perform the action on'),
    organizationId: validationRules.organizationId
  },
  listAuthorizationsOnResources: {
    userId: validationRules.userId,
    resources: validationRules.resources,
    organizationId: validationRules.organizationId
  }
}

module.exports = {
  users,
  teams,
  policies,
  organizations,
  authorize
}
