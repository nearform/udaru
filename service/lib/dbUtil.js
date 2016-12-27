'use strict'

function SQL (strings, ...values) {
  return new SqlStatement(strings, values)
}

class SqlStatement {

  constructor (strings, values) {
    this.strings = strings
    this.values = values
  }

  glue (pieces, separator) {
    const result = pieces
      .map((piece) => {
        piece.strings = piece.strings.filter(s => !!s.trim())

        return piece
      })
      .reduce((res, current) => {
        res.strings = res.strings.concat(current.strings)
        res.values = res.values.concat(current.values)

        return res
      }, { strings: [], values: [] })

    result.strings = result.strings.map((value, index) => {
      if (index === 0 || value.trim() === '') {
        return value
      }

      return separator + value
    }).concat([' '])

    return new SqlStatement(
      result.strings,
      result.values
    )
  }

  get text () {
    return this.strings.reduce((prev, curr, i) => {
      return prev + '$' + i + curr
    }).replace(/^\s+/, '')
  }

  append (statement) {
    /* TODO: fix "Cannot assign to read only property '0' of object '[object Array]'"
     *
     * this.strings[this.strings.length - 1] += statement.strings[0]
     * this.strings.push.apply(this.strings, statement.strings.slice(1));
     */

    const last = this.strings[this.strings.length - 1]
    const [first, ...rest] = statement.strings

    this.strings = this.strings.slice(0, -1).concat(last + first, rest)
    this.values.push.apply(this.values, statement.values)

    return this
  }
}


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
    path: row.path
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
  SQL: SQL,
  mapping: {
    organization: mapOrganization,
    policy: mapPolicy,
    user: mapUser,
    team: mapTeam
  }
}
