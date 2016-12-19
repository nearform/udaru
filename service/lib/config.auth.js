const Reconfig = require('reconfig')

const actionsDefinition = require('./../conf/actions.json')
const resourcesDefinition = require('./../conf/resources.json')

const actionsConfig = new Reconfig({
  template: '{{ definition.namespace }}:## context ##:## operation ##',
  definition: actionsDefinition
}, {
  paramsInterpolation: ['## ', ' ##']
})

const resourcesConfig = new Reconfig({
  namespace: resourcesDefinition.namespace,
  templates: {
    organization: '/{{ namespace }}/organization/## organization ##',
    team: '/{{ namespace }}/team/## organization ##/## team ##',
    user: '/{{ namespace }}/user/## organization ##/## team ##/## user ##'
  },
  definition: resourcesDefinition,
}, {
  paramsInterpolation: ['## ', ' ##']
})

const Interpolation = {
  organization: 'organizationId',
  team: 'teamId',
  user: 'userId',
}

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

const Resources = {
  organizations: getResource.bind(null, 'organization'),
  teams: getResource.bind(null, 'team'),
  users: getResource.bind(null, 'user')
}

module.exports = {
  Action: Actions,
  Resource: Resources,
  Interpolation
}


function generateAction (context, operation) {
  const ctx = actionsConfig.get(`definition.${context}.text`)
  const op = operation ? actionsConfig.get(`definition.${context}.operations.${operation}`) : '*'

  return actionsConfig.get('template', {
    context: ctx,
    operation: op
  })
}


function getResource (resource, params) {
  const organization = getResourceValue(params, 'organization')
  const team = getResourceValue(params, 'team')
  const user = getResourceValue(params, 'user')

  const scope = resourcesConfig.get(`definition.${resource}.scope`)
  return resourcesConfig.get(`templates.${resource}`, {
    scope,
    organization,
    team,
    user
  })
}

function getResourceValue (params, resource) {
  let value = '*'

  if (typeof params[resource] === 'string') {
    value = params[resource]
  } else if (typeof  params[resource] === 'object') {
    if (params[resource].interpolate) {
      value = ':' + Interpolation[resource]
    }
    else if (params[resource].context) {
      const context = resourcesConfig.get(`definition.${resource}.context`)
      value = `{${context}}`
    }
  }

  return value
}
