'use strict'

const Joi = require('joi')

const requiredString = Joi.string().required()

const validationRules = {
  id: Joi.string().required(),
  name: requiredString.description('Name'),
  description: requiredString.description('Description'),
  organizationId: requiredString.description('Organization ID'),
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
    id: validationRules.id.description('User ID'),
    organizationId: validationRules.organizationId
  },
  createUser: {
    id: validationRules.id.optional().description('User ID'),
    name: validationRules.name,
    organizationId: validationRules.organizationId
  },
  deleteUser: {
    id: validationRules.id.description('User ID'),
    organizationId: validationRules.organizationId
  },
  updateUser: {
    id: validationRules.id.description('User ID'),
    name: validationRules.name,
    organizationId: validationRules.organizationId
  },
  replaceUserPolicies: {
    id: validationRules.id.description('User ID'),
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  addUserPolicies: {
    id: validationRules.id.description('User ID'),
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  deleteUserPolicies: {
    id: validationRules.id.description('User ID'),
    organizationId: validationRules.organizationId
  },
  deleteUserPolicy: {
    userId: validationRules.id.description('User ID'),
    policyId: validationRules.policyId,
    organizationId: validationRules.organizationId
  },
  replaceUserTeams: {
    id: validationRules.id.description('User ID'),
    teams: validationRules.teams,
    organizationId: validationRules.organizationId
  },
  deleteUserFromTeams: {
    id: validationRules.id.description('User ID'),
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
    parentId: Joi.any(),
    name: requiredString.description('Team name'),
    description: validationRules.description,
    user: validationRules.user,
    organizationId: validationRules.organizationId
  },
  readTeam: {
    id: validationRules.id.description('Team ID'),
    organizationId: validationRules.organizationId
  },
  updateTeam: {
    id: validationRules.id.description('Team ID'),
    name: validationRules.name.optional(),
    description: validationRules.description.optional(),
    organizationId: validationRules.organizationId
  },
  deleteTeam: {
    id: validationRules.id.description('Team ID'),
    organizationId: validationRules.organizationId
  },
  moveTeam: {
    id: validationRules.id.description('Team ID'),
    parentId: validationRules.parentId,
    organizationId: validationRules.organizationId
  },
  addTeamPolicies: {
    id: validationRules.id.description('Team ID'),
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  replaceTeamPolicies: {
    id: validationRules.id.description('Team ID'),
    policies: validationRules.policies,
    organizationId: validationRules.organizationId
  },
  deleteTeamPolicies: {
    id: validationRules.id.description('Team ID'),
    organizationId: validationRules.organizationId
  },
  deleteTeamPolicy: {
    teamId: validationRules.id.description('Team ID'),
    policyId: validationRules.policyId,
    organizationId: validationRules.organizationId
  },
  readTeamUsers: {
    id: validationRules.id.description('Team ID'),
    page: validationRules.page,
    limit: validationRules.limit,
    organizationId: validationRules.organizationId
  },
  addUsersToTeam: {
    id: validationRules.id.description('Team ID'),
    users: validationRules.users,
    organizationId: validationRules.organizationId
  },
  replaceUsersInTeam: {
    id: validationRules.id.description('Team ID'),
    users: validationRules.users,
    organizationId: validationRules.organizationId
  },
  deleteTeamMembers: {
    id: validationRules.id.description('Team ID'),
    organizationId: validationRules.organizationId
  },
  deleteTeamMember: {
    id: validationRules.id.description('Team ID'),
    userId: validationRules.id.description('User ID'),
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
    id: validationRules.id.description('Policy ID'),
    organizationId: validationRules.organizationId
  },
  createPolicy: {
    id: Joi.string().allow('').description('policy id'),
    version: validationRules.version,
    name: validationRules.name,
    organizationId: validationRules.organizationId,
    statements: validationRules.statements
  },
  updatePolicy: {
    id: validationRules.id.description('Policy ID'),
    organizationId: validationRules.organizationId,
    version: validationRules.version,
    name: validationRules.name,
    statements: validationRules.statements
  },
  deletePolicy: {
    id: validationRules.id.description('Policy ID'),
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
    id: Joi.string().description('Organization ID'),
    name: validationRules.name,
    description: validationRules.description,
    user: validationRules.user
  },
  deleteById: validationRules.organizationId,
  update: {
    id: validationRules.organizationId,
    name: validationRules.name,
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
    userId: validationRules.id.description('User ID'),
    action: requiredString.description('The action to check'),
    resource: requiredString.description('The resource that the user wants to perform the action on'),
    organizationId: validationRules.organizationId
  },
  listAuthorizations: {
    userId: validationRules.id.description('User ID'),
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
