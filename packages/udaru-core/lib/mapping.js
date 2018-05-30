'use strict'

const _ = require('lodash')

function pathToId (id) {
  return id.replace(/_/g, '-')
}

function mapOrganization (row) {
  var org = {
    id: row.id,
    name: row.name,
    description: row.description
  }

  if (row.metadata) {
    org.metadata = row.metadata
  }

  return org
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
    variables: row.variables || {},
    instance: row.policy_instance
  }
}

function mapPolicyInstances (row) {
  return {
    entityType: row.entity_type,
    entityId: row.entity_id,
    instance: row.policy_instance,
    variables: row.variables || {}
  }
}

mapPolicy.iam = mapIamPolicy
mapPolicy.simple = mapPolicySimple
mapPolicy.instances = mapPolicyInstances

function mapUser (row) {
  var user = { id: row.id,
    name: row.name,
    organizationId: row.org_id
  }

  if (row.metadata) {
    user.metadata = row.metadata
  }
  return user
}

function mapUserSimple (row) {
  return {
    id: row.id,
    name: row.name
  }
}

mapUser.simple = mapUserSimple

function mapTeam (row) {
  var team = {
    id: row.id,
    name: row.name,
    description: row.description,
    path: pathToId(row.path),
    organizationId: row.org_id
  }

  if (row.metadata) {
    team.metadata = row.metadata
  }

  return team
}

function mapTeamList (row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    path: pathToId(row.path),
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

function mapNestedTeam (row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    path: pathToId(row.path),
    organizationId: row.org_id,
    usersCount: parseInt(row.users_count, 10)
  }
}

mapTeam.listNestedTeam = mapNestedTeam

module.exports = {
  organization: mapOrganization,
  policy: mapPolicy,
  user: mapUser,
  team: mapTeam
}
