const Reconfig = require('reconfig')

const actionsDefinition = require('./../../conf/actions.json')

const actionsConfig = new Reconfig({
  template: '{{ definition.namespace }}:[context]:[operation]',
  definition: actionsDefinition
}, {
  paramsInterpolation: ['[', ']'],
  envPrefix: 'LABS_AUTH_ACTIONS'
})

const resourcesConfig = new Reconfig({
  namespace: 'authorization',
  templates: {
    organizations: '/{{ namespace }}/organization/[organizationId]',
    teams: '/{{ namespace }}/team/[organizationId]/[teamId]',
    users: '/{{ namespace }}/user/[organizationId]/[teamId]/[userId]',
    policies: '/{{ namespace }}/policy/[organizationId]'
  }
}, {
  paramsInterpolation: ['[', ']'],
  envPrefix: 'LABS_AUTH_RESOURCES'
})

const Actions = {
  // organization
  CreateOrganization: generateAction('organization', 'create'),
  UpdateOrganization: generateAction('organization', 'update'),
  ReadOrganization: generateAction('organization', 'read'),
  DeleteOrganization: generateAction('organization', 'delete'),
  ListOrganizations: generateAction('organization', 'list'),
  AllOrganization: generateAction('organization'),

  // team
  CreateTeam: generateAction('team', 'create'),
  UpdateTeam: generateAction('team', 'update'),
  ReadTeam: generateAction('team', 'read'),
  DeleteTeam: generateAction('team', 'delete'),
  ListTeams: generateAction('team', 'list'),
  ManageTeams: generateAction('team', 'manage'),
  AddTeamPolicy: generateAction('team', 'addPolicy'),
  ReplaceTeamPolicy: generateAction('team', 'replacePolicy'),
  RemoveTeamPolicy: generateAction('team', 'removePolicy'),
  AddTeamMemeber: generateAction('team', 'addMemeber'),
  ReplaceTeamMemeber: generateAction('team', 'replaceMemeber'),
  RemoveTeamMemeber: generateAction('team', 'removeMemeber'),
  AllTeam: generateAction('team'),

  // user
  CreateUser: generateAction('user', 'create'),
  UpdateUser: generateAction('user', 'update'),
  ReadUser: generateAction('user', 'read'),
  DeleteUser: generateAction('user', 'delete'),
  ListUsers: generateAction('user', 'list'),
  AddUserPolicy: generateAction('user', 'addPolicy'),
  ReplaceUserPolicy: generateAction('user', 'replacePolicy'),
  RemoveUserPolicy: generateAction('user', 'removePolicy'),
  AllUser: generateAction('user'),

  // policy
  CreatePolicy: generateAction('policy', 'create'),
  UpdatePolicy: generateAction('policy', 'update'),
  ReadPolicy: generateAction('policy', 'read'),
  DeletePolicy: generateAction('policy', 'delete'),
  ListPolicies: generateAction('policy', 'list'),
  AllPolicy: generateAction('policy'),

  // authorization
  CheckAccess: generateAction('authorization', 'access'),
  ListActions: generateAction('authorization', 'actions')
}

module.exports = {
  Action: Actions,
  resources: {
    organizations: getResource.bind(null, 'organizations'),
    teams: getResource.bind(null, 'teams'),
    users: getResource.bind(null, 'users'),
    policies: getResource.bind(null, 'policies')
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
