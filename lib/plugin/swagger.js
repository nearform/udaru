'use strict'

const Joi = require('joi')

const PolicyStatements = Joi.object({
  Statement: Joi.array().items(Joi.object({
    Effect: Joi.string().valid('Allow', 'Deny').description('Statement result'),
    Action: Joi.array().items(Joi.string()).description('Action to perform on resource'),
    Resource: Joi.array().items(Joi.string()).description('Resource that the statement covers'),
    Sid: Joi.string().description('Statement ID'),
    Condition: Joi.object().description('Condition operator used when evaluating effect')
  }).label('StatementElement'))
}).label('PolicyStatements')

const Policy = Joi.object({
  id: Joi.string().description('Policy ID'),
  version: Joi.string().description('Policy version'),
  name: Joi.string().description('Policy name'),
  statements: PolicyStatements
}).label('Policy')

const PolicyRef = Joi.object({
  id: Joi.string().description('Policy ID'),
  version: Joi.string().description('Policy version'),
  name: Joi.string().description('Policy name')
}).label('PolicyRef')

const UserRef = Joi.object({
  id: Joi.string().description('User ID'),
  name: Joi.string().description('User name')
}).label('UserRef')

const Team = Joi.object({
  id: Joi.string().description('Team ID'),
  name: Joi.string().description('Team name'),
  description: Joi.string().description('Team description'),
  path: Joi.string(),
  users: Joi.array().items(UserRef).description('Team users'),
  policies: Joi.array().items(PolicyRef),
  organizationId: Joi.string().description('Organization ID to which the team belongs to'),
  usersCount: Joi.number().description('Number of team users. Sub team users not counted.')
}).label('Team')

const TeamRef = Joi.object({
  id: Joi.string(),
  name: Joi.string()
}).label('TeamRef')

const User = Joi.object({
  id: Joi.string().description('User ID'),
  name: Joi.string().description('User name'),
  organizationId: Joi.string().description('Organization ID to which the user belongs to'),
  teams: Joi.array().items(TeamRef),
  policies: Joi.array().items(PolicyRef)
}).label('User')

const Organization = Joi.object({
  id: Joi.string().description('Organization ID'),
  name: Joi.string().description('Organization name'),
  description: Joi.string().description('Organization description'),
  policies: Joi.array().items(PolicyRef)
}).label('Organization')

const OrganizationAndUser = Joi.object({
  organization: Organization,
  user: UserRef
}).label('OrganizationAndUser')

const List = (data) => {
  return Joi.object({
    page: Joi.number().integer().min(1).description('Page number, starts from 1'),
    limit: Joi.number().integer().min(1).description('Items per page'),
    total: Joi.number().integer().description('Total number of entries matched by the query'),
    data: Joi.array().items(data).label('Data')
  }).label('DataList')
}

const Access = Joi.object({
  access: Joi.boolean()
}).label('Access')

const UserActions = Joi.object({
  actions: Joi.array().items(Joi.string())
}).label('UserActions')

const UserActionsOnResources = Joi.array().items(Joi.object({
  resource: Joi.string(),
  actions: Joi.array().items(Joi.string())
})).label('UserActionsOnResources')

module.exports = {
  List,
  User,
  UserActions,
  UserActionsOnResources,
  Team,
  Policy,
  PolicyRef,
  Organization,
  OrganizationAndUser,
  PolicyStatements,
  Access
}
