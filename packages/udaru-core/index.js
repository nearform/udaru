'use strict'

const buildUserOps = require('./lib/ops/userOps')
const buildOrganizationOps = require('./lib/ops/organizationOps')
const buildAuthorizeOps = require('./lib/ops/authorizeOps')
const buildTeamOps = require('./lib/ops/teamOps')
const buildPolicyOps = require('./lib/ops/policyOps')
const buildDb = require('./lib/db')
const buildConfig = require('./config')
const buildHooks = require('./lib/hooks')

function buildUdaruCore (dbPool, config) {
  const fullConfig = buildConfig(config)
  const db = buildDb(dbPool, fullConfig)

  const userOps = buildUserOps(db, fullConfig)
  const organizationOps = buildOrganizationOps(db, fullConfig)
  const authorizeOps = buildAuthorizeOps(db, fullConfig)
  const teamOps = buildTeamOps(db, fullConfig)
  const policyOps = buildPolicyOps(db, fullConfig)

  const hooks = buildHooks(fullConfig)

  return {
    config,
    fullConfig,

    getUserOrganizationId: hooks.wrap('users:getUserOrganizationId', userOps.getUserOrganizationId),

    db: {
      close: db.shutdown
    },

    hooks: {
      add: hooks.add,
      clear: hooks.clear
    },

    authorize: {
      isUserAuthorized: hooks.wrap('authorize:isUserAuthorized', authorizeOps.isUserAuthorized),
      listActions: hooks.wrap('authorize:listActions', authorizeOps.listAuthorizations),
      listAuthorizationsOnResources: hooks.wrap('authorize:listAuthorizationsOnResources', authorizeOps.listAuthorizationsOnResources)
    },

    organizations: {
      list: hooks.wrap('organization:list', organizationOps.list),
      create: hooks.wrap('organization:create', organizationOps.create),
      read: hooks.wrap('organization:read', organizationOps.readById),
      delete: hooks.wrap('organization:delete', organizationOps.deleteById),
      update: hooks.wrap('organization:update', organizationOps.update),
      addPolicies: hooks.wrap('organization:addPolicies', organizationOps.addOrganizationPolicies),
      amendPolicies: hooks.wrap('organization:amendPolicies', organizationOps.amendOrganizationPolicies),
      replacePolicies: hooks.wrap('organization:replacePolicies', organizationOps.replaceOrganizationPolicies),
      deletePolicies: hooks.wrap('organization:deletePolicies', organizationOps.deleteOrganizationAttachedPolicies),
      deletePolicy: hooks.wrap('organization:deletePolicy', organizationOps.deleteOrganizationAttachedPolicy),
      listPolicies: hooks.wrap('team:listPolicies', organizationOps.listOrganizationPolicies)
    },

    policies: {
      list: hooks.wrap('policy:list', policyOps.listByOrganization),
      read: hooks.wrap('policy:read', policyOps.readPolicy),
      create: hooks.wrap('policy:create', policyOps.createPolicy),
      update: hooks.wrap('policy:update', policyOps.updatePolicy),
      delete: hooks.wrap('policy:delete', policyOps.deletePolicy),
      listShared: hooks.wrap('policy:listShared', policyOps.listSharedPolicies),
      createShared: hooks.wrap('policy:createShared', policyOps.createSharedPolicy),
      updateShared: hooks.wrap('policy:updateShared', policyOps.updateSharedPolicy),
      deleteShared: hooks.wrap('policy:deleteShared', policyOps.deleteSharedPolicy),
      readShared: hooks.wrap('policy:readShared', policyOps.readSharedPolicy),
      search: hooks.wrap('policy:search', policyOps.search),
      readPolicyVariables: hooks.wrap('policy:variables', policyOps.readPolicyVariables)
    },

    teams: {
      list: hooks.wrap('team:list', teamOps.listOrgTeams),
      create: hooks.wrap('team:create', teamOps.createTeam),
      read: hooks.wrap('team:read', teamOps.readTeam),
      update: hooks.wrap('team:update', teamOps.updateTeam),
      delete: hooks.wrap('team:delete', teamOps.deleteTeam),
      move: hooks.wrap('team:move', teamOps.moveTeam),
      listUsers: hooks.wrap('team:listUsers', teamOps.readTeamUsers),
      replacePolicies: hooks.wrap('team:replacePolicies', teamOps.replaceTeamPolicies),
      addPolicies: hooks.wrap('team:addPolicies', teamOps.addTeamPolicies),
      amendPolicies: hooks.wrap('team:amendPolicies', teamOps.amendTeamPolicies),
      deletePolicies: hooks.wrap('team:deletePolicies', teamOps.deleteTeamPolicies),
      deletePolicy: hooks.wrap('team:deletePolicy', teamOps.deleteTeamPolicy),
      addUsers: hooks.wrap('team:addUsers', teamOps.addUsersToTeam),
      replaceUsers: hooks.wrap('team:replaceUsers', teamOps.replaceUsersInTeam),
      deleteMembers: hooks.wrap('team:deleteMembers', teamOps.deleteTeamMembers),
      deleteMember: hooks.wrap('team:deleteMember', teamOps.deleteTeamMember),
      listNestedTeams: hooks.wrap('team:listNestedTeams', teamOps.listNestedTeams),
      search: hooks.wrap('team:search', teamOps.search),
      searchUsers: hooks.wrap('team:searchUsers', teamOps.searchUsers),
      listPolicies: hooks.wrap('team:listPolicies', teamOps.listTeamPolicies)
    },

    users: {
      list: hooks.wrap('users:list', userOps.listOrgUsers),
      create: hooks.wrap('users:create', userOps.createUser),
      read: hooks.wrap('users:read', userOps.readUser),
      update: hooks.wrap('users:update', userOps.updateUser),
      delete: hooks.wrap('users:delete', userOps.deleteUser),
      replacePolicies: hooks.wrap('users:replacePolicies', userOps.replaceUserPolicies),
      addPolicies: hooks.wrap('users:addPolicies', userOps.addUserPolicies),
      amendPolicies: hooks.wrap('users:amendPolicies', userOps.amendUserPolicies),
      deletePolicies: hooks.wrap('users:deletePolicies', userOps.deleteUserPolicies),
      deletePolicy: hooks.wrap('users:deletePolicy', userOps.deleteUserPolicy),
      listUserTeams: hooks.wrap('users:listUserTeams', userOps.listUserTeams),
      replaceTeams: hooks.wrap('users:replaceTeams', userOps.replaceUserTeams),
      deleteTeams: hooks.wrap('users:deleteTeams', userOps.deleteUserFromTeams),
      search: hooks.wrap('users:search', userOps.search),
      listPolicies: hooks.wrap('users:listPolicies', userOps.listUserPolicies)
    }
  }
}

module.exports = buildUdaruCore
