'use strict'

const UserOps = require('./lib/ops/userOps')
const OrganizationOps = require('./lib/ops/organizationOps')
const AuthorizeOps = require('./lib/ops/authorizeOps')
const TeamOps = require('./lib/ops/teamOps')
const PolicyOps = require('./lib/ops/policyOps')
const dbInit = require('./lib/db')

function udaru (config) {

  const db = dbInit(config)

  const userOps = UserOps(db)
  const policyOps = PolicyOps(db)
  const organizationOps = OrganizationOps(db, policyOps, userOps)
  const teamOps = TeamOps(db, policyOps, userOps)
  const authorizeOps = AuthorizeOps(policyOps)

  return {
    getUserOrganizationId: userOps.getUserOrganizationId,

    authorize: {
      isUserAuthorized: authorizeOps.isUserAuthorized,
      listActions: authorizeOps.listAuthorizations
    },

    organizations: {
      list: organizationOps.list,
      create: organizationOps.create,
      read: organizationOps.readById,
      delete: organizationOps.deleteById,
      update: organizationOps.update
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
      deletePolicy: userOps.deleteUserPolicy
    }
  }
}

module.exports = udaru
