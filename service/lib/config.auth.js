const Reconfig = require('reconfig')

const actionsDefinition = require('./../conf/actions.json')

const actionsConfig = new Reconfig({
  template: '{{ definition.namespace }}:[context]:[operation]',
  definition: actionsDefinition
}, {
  paramsInterpolation: ['[', ']']
})

const resourcesConfig = new Reconfig({
  namespace: 'authorization',
  templates: {
    organizations: '/{{ namespace }}/organization/[organizationId]',
    teams: '/{{ namespace }}/team/[organizationId]/[teamId]',
    users: '/{{ namespace }}/user/[organizationId]/[teamId]/[userId]'
  }
}, {
  paramsInterpolation: ['[', ']']
})

const Actions = {
  // organization
  CreateOrganization: generateAction('organization', 'create'),
  UpdateOrganization: generateAction('organization', 'update'),
  ReadOrganization: generateAction('organization', 'read'),
  DeleteOrganization: generateAction('organization', 'delete'),
  ListMyOrganizations: generateAction('organization', 'list'),
  Organization: generateAction('organization'),

  // team
  CreateTeam: generateAction('team', 'create'),
  UpdateTeam: generateAction('team', 'update'),
  ReadTeam: generateAction('team', 'read'),
  DeleteTeam: generateAction('team', 'delete'),
  ListMyTeams: generateAction('team', 'list'),
  Team: generateAction('team'),

  // user
  CreateUser: generateAction('user', 'create'),
  UpdateUser: generateAction('user', 'update'),
  ReadUser: generateAction('user', 'read'),
  DeleteUser: generateAction('user', 'delete'),
  ListMyUsers: generateAction('user', 'list'),
  User: generateAction('user'),

  // policy
  CreatePolicy: generateAction('policy', 'create'),
  UpdatePolicy: generateAction('policy', 'update'),
  ReadPolicy: generateAction('policy', 'read'),
  DeletePolicy: generateAction('policy', 'delete'),
  ListMyPolicies: generateAction('policy', 'list'),
  Policy: generateAction('policy')
}

module.exports = {
  Action: Actions,
  resources: {
    organizations: getResource.bind(null, 'organizations'),
    teams: getResource.bind(null, 'teams'),
    users: getResource.bind(null, 'users')
  }
}

function generateAction (context, operation) {
  const ctx = actionsConfig.get(`definition.${context}.text`)
  const op = operation ? actionsConfig.get(`definition.${context}.operations.${operation}`) : '*'

  return actionsConfig.get('template', {
    context: ctx,
    operation: op
  })
}

function getResource (type, data = {}) {
  const template = resourcesConfig.get(`templates.${type}`)

  const params = template
    .match(/[^[\]]+(?=])/g)
    .reduce((prev, match) => {
      const name = match.replace(/[[]]/g, '')
      return Object.assign(prev, { [name]: data[name] || '*' })
    }, {})

  return resourcesConfig.get(`templates.${type}`, params)
}
