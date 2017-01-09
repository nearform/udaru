'use strict'

function mapOrganization (row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description
  }
}

function mapPolicy (row) {
  return {
    id: row.id,
    version: row.version,
    name: row.name,
    statements: row.statements
  }
}

function mapIamPolicy (row) {
  return {
    Version: row.version,
    Name: row.name,
    Statement: row.statements.Statement
  }
}

function mapPolicySimple (row) {
  return {
    id: row.id,
    name: row.name,
    version: row.version
  }
}

mapPolicy.iam = mapIamPolicy
mapPolicy.simple = mapPolicySimple

function mapUser (row) {
  return {
    id: row.id,
    name: row.name,
    organizationId: row.org_id
  }
}

function mapUserSimple (row) {
  return {
    id: row.id,
    name: row.name
  }
}

mapUser.simple = mapUserSimple

function mapTeam (row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path: row.path,
    organizationId: row.org_id
  }
}

function mapTeamSimple (row) {
  return {
    id: row.id,
    name: row.name
  }
}

mapTeam.simple = mapTeamSimple


module.exports = {
  organization: mapOrganization,
  policy: mapPolicy,
  user: mapUser,
  team: mapTeam
}
