'use strict'

const userOps = require('./lib/ops/userOps')
const organizationOps = require('./lib/ops/organizationOps')
const authorizeOps = require('./lib/ops/authorizeOps')
const teamOps = require('./lib/ops/teamOps')
const policyOps = require('./lib/ops/policyOps')

module.exports = {
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
