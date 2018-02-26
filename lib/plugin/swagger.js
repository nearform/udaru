'use strict'

const Joi = require('joi')

const MetaData = Joi.object().optional().description('Arbitrary Metadata').label('MetaData')

const PolicyStatements = Joi.object({
  Statement: Joi.array().items(Joi.object({
    Effect: Joi.string().valid('Allow', 'Deny').description('Statement result').label('Effect'),
    Action: Joi.array().items(Joi.string()).description('Action to perform on resource').label('Actions'),
    Resource: Joi.array().items(Joi.string()).description('Resource that the statement covers').label('Resources'),
    Sid: Joi.string().description('Statement ID').label('Sid'),
    Condition: Joi.object().description('Condition operator used when evaluating effect')
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
  variables: Joi.object().description('List of fixed values for variables').label('Variables')
}).label('PolicyRef')
const PolicyRefs = Joi.array().items(PolicyRef).description('Policy Refs').label('PolicyRefs')

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

const POLICIES = 1
const TEAMS = 2
const TEAMREFS = 3
const USERS = 4
const ORGANIZATIONS = 5

function getDataArray (listType) {
  // todo: based on object return fixed type for swagger
  if (listType === POLICIES) return Policies
  if (listType === TEAMS) return Teams
  if (listType === TEAMREFS) return TeamRefs
  if (listType === USERS) return Users
  if (listType === ORGANIZATIONS) return Organizations

  return null
}

const List = (listType) => {
  return Joi.object({
    page: Joi.number().integer().min(1).description('Page number, starts from 1'),
    limit: Joi.number().integer().min(1).description('Items per page'),
    total: Joi.number().integer().description('Total number of entries matched by the query'),
    data: getDataArray(listType)
  }).label('PagedList')
}

const PagedPolicies = List(POLICIES).label('PagedPolicies')
const PagedTeams = List(TEAMS).label('PagedTeams').description('Note: teams users and policies are not populated in paged teams list')
const PagedTeamRefs = List(TEAMREFS).label('PagedTeamRefs')
const PagedUsers = List(USERS).label('PagedUsers')
const PagedOrganizations = List(ORGANIZATIONS).label('PagedOrganizations')

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

module.exports = {
  List,
  User,
  UserActions,
  UserActionsOnResources,
  Team,
  TeamRef,
  Policy,
  PagedPolicies,
  PagedTeams,
  PagedTeamRefs,
  PagedUsers,
  PagedOrganizations,
  PolicyRef,
  Organization,
  OrganizationAndUser,
  PolicyStatements,
  Access
}
