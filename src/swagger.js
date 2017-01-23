'use strict'

const Joi = require('joi')

const PolicyStatements = Joi.object({
  Statement: Joi.array().items(Joi.object({
    Effect: Joi.string(),
    Action: Joi.array().items(Joi.string()),
    Resource: Joi.array().items(Joi.string()),
    Sid: Joi.string(),
    Condition: Joi.object()
  }))
})

const Policy = Joi.object({
  id: Joi.string(),
  version: Joi.string(),
  name: Joi.string(),
  statements: PolicyStatements
})

const PolicyRef = Joi.object({
  id: Joi.string(),
  version: Joi.string(),
  name: Joi.string()
})

const UserRef = Joi.object({
  id: Joi.string(),
  name: Joi.string()
})

const Team = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string(),
  path: Joi.string(),
  users: Joi.array().items(UserRef),
  policies: Joi.array().items(PolicyRef),
  organizationId: Joi.string(),
  usersCount: Joi.number()
})

const TeamRef = Joi.object({
  id: Joi.string(),
  name: Joi.string()
})

const User = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  organizationId: Joi.string(),
  teams: Joi.array().items(TeamRef),
  policies: Joi.array().items(PolicyRef)
})

const MetadataUserList = Joi.object({
  currentPage: Joi.number().integer(),
  pageSize: Joi.number().integer(),
  totalPages: Joi.number().integer(),
  totalUsersCount: Joi.number().integer(),
  users: Joi.array().items(User)
})

const Organization = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string()
})
const OrganizationAndUser = Joi.object({
  organization: Organization,
  user: UserRef
})

const List = (data) => {
  return Joi.object({
    page: Joi.number().integer().min(1).description('Page number, starts from 1'),
    limit: Joi.number().integer().min(1).description('Items per page'),
    total: Joi.number().integer().positive().description('Total number of entries matched by the query'),
    data: Joi.array().items(data)
  })
}

module.exports = {
  List,
  MetadataUserList,
  User,
  Team,
  Policy,
  PolicyRef,
  Organization,
  OrganizationAndUser,
  PolicyStatements
}
