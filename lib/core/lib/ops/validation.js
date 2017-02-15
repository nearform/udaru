'use strict'

const Joi = require('joi')

const requiredString = Joi.string().required()
const requiredStringId = Joi.string().required().max(128)

const validationRules = {
  name: requiredString.description('Name'),
  userName: requiredString.description('Name'),
  teamName: requiredString.description('Name'),
  policyName: requiredString.description('Name'),
  organizationName: requiredString.description('Name'),
  description: requiredString.description('Description'),
  userId: requiredStringId.description('User ID'),
  teamId: requiredStringId.description('Team ID'),
  organizationId: requiredStringId.description('Organization ID'),
  page: Joi.number().integer().min(1).description('Page number, starts from 1'),
  limit: Joi.number().integer().min(1).description('Items per page'),
  version: requiredString.description('Version number'),

  user: Joi.object().description('Default admin').keys({
    id: Joi.string().description('User ID'),
    name: requiredString.description('User name')
  }),

  parentId: Joi.string().description('Parent ID'),
  policyId: requiredString.description('Policy ID'),

  users: Joi.array().required().items(requiredString).description('User IDs'),
  policies: Joi.array().required().items(requiredString).description('Policies IDs'),
  teams: Joi.array().required().items(requiredString).description('Teams IDs'),

  statements: Joi.object({
    Statement: Joi.array().items(Joi.object({
      Effect: Joi.string(),
      Action: Joi.array().items(Joi.string()),
      Resource: Joi.array().items(Joi.string()),
      Sid: Joi.string(),
      Condition: Joi.object()
    }))
  }).required().description('policy statements')

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
    organizationId: validationRules.organizationId
  },
  deleteUser: {
    id: validationRules.userId,
    organizationId: validationRules.organizationId
  },
  updateUser: {
    id: validationRules.userId,
    name: validationRules.userName,
    organizationId: validationRules.organizationId
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
  }
}

const teams = {
  listOrgTeams: {
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  createTeam: {
    id: Joi.string().regex(/^[0-9a-zA-Z_]+$/).description('The ID to be used for the new team. Only alphanumeric characters and underscore are supported'),
    parentId: validationRules.teamId.optional().allow(null),
    name: validationRules.teamName,
    description: validationRules.description,
    user: validationRules.user,
    organizationId: validationRules.organizationId
  },
  readTeam: {
    id: validationRules.teamId,
    organizationId: validationRules.organizationId
  },
  updateTeam: {
    id: validationRules.teamId,
    name: validationRules.teamName.optional(),
    description: validationRules.description.optional(),
    organizationId: validationRules.organizationId
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
    organizationId: validationRules.organizationId
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
    id: Joi.string().allow('').description('Policy ID'),
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
    user: validationRules.user
  },
  deleteById: validationRules.organizationId,
  update: {
    id: validationRules.organizationId,
    name: validationRules.organizationName,
    description: validationRules.description
  },
  addOrganizationPolicies: {
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
    policyId: validationRules.policyId
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
  }
}

module.exports = {
  users,
  teams,
  policies,
  organizations,
  authorize
}
