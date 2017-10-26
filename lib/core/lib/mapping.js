'use strict'

const _ = require('lodash')

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

function compileStatements (statements, variables) {
  _.each(statements, function (statement) {
    if (statement.Resource) {
      statement.Resource = _.map(statement.Resource, function (resource) {
        return resource.replace(/\${(.+?)}/g, function (match, variable) {
          return _.get(variables, variable, match)
        })
      })
    }
  })

  return statements
}

function mapIamPolicy (row) {
  const variables = row.variables || {}

  return {
    Version: row.version,
    Name: row.name,
    Statement: compileStatements(row.statements.Statement, variables)
  }
}

function mapPolicySimple (row) {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    variables: row.variables || {}
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

function mapTeamList (row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path: row.path,
    organizationId: row.org_id,
    usersCount: parseInt(row.users_count, 10)
  }
}

mapTeam.list = mapTeamList

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
