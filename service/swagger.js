'use strict'

const Joi = require('joi')

const PolicyStatements = Joi.object({
  Statement: Joi.array().items(Joi.object({
    Effect: Joi.string(),
    Action: Joi.array().items(Joi.string()),
    Resource: Joi.array().items(Joi.string()),
    Sid: Joi.string(),
    Condition: Joi.object({})
  }))
})

const Policy = Joi.object({
  id: Joi.string(),
  version: Joi.string(),
  name: Joi.string(),
  statements: PolicyStatements
})

const PolicyList = Joi.array().items(Policy)

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
  organizationId: Joi.string()
})

const TeamList = Joi.array().items(Team)

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

const UserList = Joi.array().items(User)

const Organization = Joi.object({
  id: Joi.string(),
  name: Joi.string(),
  description: Joi.string()
})
const OrganizationAndUser = Joi.object({
  organization: Organization,
  user: UserRef
})

const OrganizationList = Joi.array().items(Organization)

module.exports = {
  UserList: UserList,
  User: User,
  TeamList: TeamList,
  Team: Team,
  PolicyList: PolicyList,
  Policy: Policy,
  PolicyRef: PolicyRef,
  Organization: Organization,
  OrganizationList: OrganizationList,
  OrganizationAndUser: OrganizationAndUser
}
