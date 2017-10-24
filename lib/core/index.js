'use strict'

const buildUserOps = require('./lib/ops/userOps')
const buildOrganizationOps = require('./lib/ops/organizationOps')
const buildAuthorizeOps = require('./lib/ops/authorizeOps')
const buildTeamOps = require('./lib/ops/teamOps')
const buildPolicyOps = require('./lib/ops/policyOps')
const buildDb = require('./lib/db')
const buildConfig = require('../config')
const defaultConfig = require('../config/default.core')

function buildUdaruCore (dbPool, config) {
  const fullConfig = buildConfig(defaultConfig, config || {})
  const db = buildDb(dbPool, fullConfig)

  const userOps = buildUserOps(db, fullConfig)
  const organizationOps = buildOrganizationOps(db, fullConfig)
  const authorizeOps = buildAuthorizeOps(db, fullConfig)
  const teamOps = buildTeamOps(db, fullConfig)
  const policyOps = buildPolicyOps(db, fullConfig)

  return {
    config,
    getUserOrganizationId: userOps.getUserOrganizationId,

    authorize: {
      isUserAuthorized: authorizeOps.isUserAuthorized,
      listActions: authorizeOps.listAuthorizations,
      listAuthorizationsOnResources: authorizeOps.listAuthorizationsOnResources
    },

    organizations: {
      list: organizationOps.list,
      create: organizationOps.create,
      read: organizationOps.readById,
      delete: organizationOps.deleteById,
      update: organizationOps.update,
      addPolicies: organizationOps.addOrganizationPolicies,
      replacePolicies: organizationOps.replaceOrganizationPolicies,
      deletePolicies: organizationOps.deleteOrganizationAttachedPolicies,
      deletePolicy: organizationOps.deleteOrganizationAttachedPolicy
    },

    policies: {
      list: policyOps.listByOrganization,
      read: policyOps.readPolicy,
      create: policyOps.createPolicy,
      update: policyOps.updatePolicy,
      delete: policyOps.deletePolicy
    },

    teams: {
      list: teamOps.listOrgTeams,
      create: teamOps.createTeam,
      read: teamOps.readTeam,
      update: teamOps.updateTeam,
      delete: teamOps.deleteTeam,
      move: teamOps.moveTeam,
      listUsers: teamOps.readTeamUsers,
      replacePolicies: teamOps.replaceTeamPolicies,
      addPolicies: teamOps.addTeamPolicies,
      deletePolicies: teamOps.deleteTeamPolicies,
      deletePolicy: teamOps.deleteTeamPolicy,
      addUsers: teamOps.addUsersToTeam,
      replaceUsers: teamOps.replaceUsersInTeam,
      deleteMembers: teamOps.deleteTeamMembers,
      deleteMember: teamOps.deleteTeamMember
    },

    users: {
      list: userOps.listOrgUsers,
      create: userOps.createUser,
      read: userOps.readUser,
      update: userOps.updateUser,
      delete: userOps.deleteUser,
      replacePolicies: userOps.replaceUserPolicies,
      addPolicies: userOps.addUserPolicies,
      deletePolicies: userOps.deleteUserPolicies,
      deletePolicy: userOps.deleteUserPolicy,
      replaceTeams: userOps.replaceUserTeams,
      deleteTeams: userOps.deleteUserFromTeams
    }
  }
}

module.exports = buildUdaruCore
