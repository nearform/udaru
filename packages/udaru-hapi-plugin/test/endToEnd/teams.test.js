'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('@nearform/udaru-core/test/testUtils')
const serverFactory = require('../test-server')
const udaru = require('@nearform/udaru-core')()

const teamData = {
  name: 'testTeam',
  description: 'This is a test team',
  parentId: null,
  organizationId: 'WONKA'
}

const metadata = { key1: 'val1', key2: 'val2' }
const teamDataMeta = {
  name: 'testTeamMeta',
  description: 'This is a test team with metadata',
  parentId: null,
  organizationId: 'WONKA',
  metadata: metadata
}

lab.experiment('Teams - search', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('should perform the search', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/search?query=p'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.result.total).equal(2)
  })
})

lab.experiment('Teams - get/list', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('get team list: with pagination params', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.result.page).to.equal(1)
    expect(response.result.limit).greaterThan(1)
  })

  lab.test('get teams list from organization with no team', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams',
      headers: {
        authorization: 'ROOTid'
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.result.page).to.equal(1)
    expect(response.result.limit).greaterThan(1)
    expect(response.result.total).equal(0)
  })

  lab.test('get team list: page 1', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?limit=3&page=1'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(3)
    expect(result.total).to.equal(6)
    expect(result.data).to.equal([
      {
        id: '1',
        name: 'Admins',
        organizationId: 'WONKA',
        description: 'Administrators of the Authorization System',
        path: '1',
        usersCount: 1
      },
      {
        id: '3',
        name: 'Authors',
        organizationId: 'WONKA',
        description: 'Content contributors',
        path: '3',
        usersCount: 1
      },
      {
        id: '6',
        name: 'Company Lawyer',
        organizationId: 'WONKA',
        description: 'Author of legal documents',
        path: '6',
        usersCount: 0
      }
    ])
  })

  lab.test('get team list: page 2', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?limit=3&page=2'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(2)
    expect(result.limit).to.equal(3)
    expect(result.total).to.equal(6)
    expect(result.data).to.equal([
      {
        id: '4',
        name: 'Managers',
        organizationId: 'WONKA',
        description: 'General Line Managers with confidential info',
        path: '4',
        usersCount: 1
      },
      {
        id: '5',
        name: 'Personnel Managers',
        organizationId: 'WONKA',
        description: 'Personnel Line Managers with confidential info',
        path: '5',
        usersCount: 1
      },
      {
        id: '2',
        name: 'Readers',
        organizationId: 'WONKA',
        description: 'General read-only access',
        path: '2',
        usersCount: 2
      }
    ])
  })

  lab.test('get team list', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams?page=1&limit=7'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.data).to.equal([
      {
        id: '1',
        name: 'Admins',
        organizationId: 'WONKA',
        description: 'Administrators of the Authorization System',
        path: '1',
        usersCount: 1
      },
      {
        id: '3',
        name: 'Authors',
        organizationId: 'WONKA',
        description: 'Content contributors',
        path: '3',
        usersCount: 1
      },
      {
        id: '6',
        name: 'Company Lawyer',
        organizationId: 'WONKA',
        description: 'Author of legal documents',
        path: '6',
        usersCount: 0
      },
      {
        id: '4',
        name: 'Managers',
        organizationId: 'WONKA',
        description: 'General Line Managers with confidential info',
        path: '4',
        usersCount: 1
      },
      {
        id: '5',
        name: 'Personnel Managers',
        organizationId: 'WONKA',
        description: 'Personnel Line Managers with confidential info',
        path: '5',
        usersCount: 1
      },
      {
        id: '2',
        name: 'Readers',
        organizationId: 'WONKA',
        description: 'General read-only access',
        path: '2',
        usersCount: 2
      }
    ])
  })

  lab.test('get single team', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${team.id}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.usersCount).to.exist()
    expect(result.usersCount).to.equal(0)
    expect(result.id).to.equal(team.id)
    expect(result.name).to.equal(team.name)

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('get single team with metadata', async () => {
    const team = await udaru.teams.create(teamDataMeta)

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${team.id}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.usersCount).to.exist()
    expect(result.usersCount).to.equal(0)
    expect(result.id).to.equal(team.id)
    expect(result.name).to.equal(team.name)
    expect(result.metadata).to.equal(team.metadata)

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('get users for a single team', async () => {
    let team = await udaru.teams.create(teamData)

    const teamUsers = [
      { id: 'AugustusId', name: 'Augustus Gloop' },
      { id: 'CharlieId', name: 'Charlie Bucket' },
      { id: 'MikeId', name: 'Mike Teavee' },
      { id: 'VerucaId', name: 'Veruca Salt' },
      { id: 'WillyId', name: 'Willy Wonka' }
    ]
    const teamUsersIds = teamUsers.map((user) => user.id)

    team = await udaru.teams.addUsers({ id: team.id, organizationId: team.organizationId, users: teamUsersIds })
    expect(team.users).to.equal(teamUsers)

    let options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${team.id}/users?page=1&limit=10`
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(10)
    expect(result.total).to.equal(5)
    expect(result.data).to.equal(teamUsers)

    options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${team.id}/users?page=2&limit=3`
    })

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(2)
    expect(result.limit).to.equal(3)
    expect(result.total).to.equal(5)
    expect(result.data).to.equal([
      { id: 'VerucaId', name: 'Veruca Salt' },
      { id: 'WillyId', name: 'Willy Wonka' }
    ])

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('return 404 if team does not exist when requesting users', async () => {
    const teamId = 'idontexist'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(result.statusCode).to.equal(404)
    expect(result.data).to.not.exist()
    expect(result.total).to.not.exist()
    expect(result.error).to.exist()
    expect(result.message).to.exist()
    expect(result.message.toLowerCase()).to.include(teamId).include('not').include('found')
  })
})

lab.experiment('Teams - create', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('Create with no id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result).to.contain({
      name: 'Team B',
      organizationId: 'WONKA',
      description: 'This is Team B',
      users: [],
      policies: [],
      path: result.id
    })

    await udaru.teams.delete({ id: result.id, organizationId: result.organizationId })
  })

  lab.test('Create with undefined id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: undefined,
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result.id).to.not.be.null()
    expect(result).to.contain({
      name: 'Team B',
      organizationId: 'WONKA',
      description: 'This is Team B',
      users: [],
      policies: [],
      path: result.id
    })

    await udaru.teams.delete({ id: result.id, organizationId: result.organizationId })
  })

  lab.test('Create with specific id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'test_fixed_id',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result).to.contain({
      id: 'test_fixed_id',
      path: 'test_fixed_id'
    })

    await udaru.teams.delete({ id: result.id, organizationId: result.organizationId })
  })

  lab.test('create team with empty id string', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: '',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('create team with null id string', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: null,
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.id).to.not.exist()
  })

  lab.test('support handling of already present id', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: '1',
        name: 'Team already present',
        description: 'This is already present'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(409)
    expect(result.message).to.equal('Key (id)=(1) already exists.')
  })

  lab.test('Create a team with metadata', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'test_meta_id',
        name: 'Team Meta',
        description: 'This is Team Meta',
        metadata: metadata
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(201)
    expect(result).to.contain({
      id: 'test_meta_id',
      path: 'test_meta_id',
      description: 'This is Team Meta',
      metadata: metadata
    })

    await udaru.teams.delete({ id: result.id, organizationId: result.organizationId })
  })

  lab.test('validates specific id format', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {
        id: 'invalid id',
        name: 'Team B',
        description: 'This is Team B'
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
    expect(response.result.validation.keys).to.include('id')
  })

  lab.test('should return a 400 Bad Request when not providing name or description', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams',
      payload: {}
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })
})

lab.experiment('Teams - update', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('update team validation nothing in payload', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2',
      payload: {
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('update only team name', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}`,
      payload: {
        name: 'Team C'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.name).to.equal('Team C')

    await udaru.teams.delete({id: team.id, organizationId: team.organizationId})
  })

  lab.test('update only team description', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}`,
      payload: {
        description: 'Team B is now Team C'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.description).to.equal('Team B is now Team C')

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('update team', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}`,
      payload: {
        name: 'Team C',
        description: 'Team B is now Team C'
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.name).to.equal('Team C')
    expect(result.description).to.equal('Team B is now Team C')

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('update team with metadata', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}`,
      payload: {
        name: 'Team Meta',
        description: 'Team B is now Team Meta',
        metadata: metadata
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.name).to.equal('Team Meta')
    expect(result.description).to.equal('Team B is now Team Meta')
    expect(result.metadata).to.equal(metadata)

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })
})

lab.experiment('Teams - delete', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('delete team should return 204 for success', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/teams/${team.id}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(204)
    expect(result).to.not.exist()
  })
})

lab.experiment('Teams - manage users', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('add users to a team', async () => {
    const team = await udaru.teams.create(teamData)

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}/users`,
      payload: {
        users: ['CharlieId', 'MikeId']
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.users).to.equal([
      { id: 'CharlieId', name: 'Charlie Bucket' },
      { id: 'MikeId', name: 'Mike Teavee' }
    ])

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('replace users in a team', async () => {
    let team = await udaru.teams.create(teamData)
    team = await udaru.teams.addUsers({ id: team.id, organizationId: team.organizationId, users: ['CharlieId'] })

    const options = utils.requestOptions({
      method: 'POST',
      url: `/authorization/teams/${team.id}/users`,
      payload: {
        users: ['MikeId']
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.id).to.equal(team.id)
    expect(result.users).to.equal([
      { id: 'MikeId', name: 'Mike Teavee' }
    ])

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('delete all team members', async () => {
    let team = await udaru.teams.create(teamData)
    team = await udaru.teams.addUsers({ id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId'] })

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/teams/${team.id}/users`
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('delete one team member', async () => {
    let team = await udaru.teams.create(teamData)
    team = await udaru.teams.addUsers({ id: team.id, organizationId: team.organizationId, users: ['CharlieId', 'MikeId'] })

    const options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/teams/${team.id}/users/CharlieId`
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
  })

  lab.test('default team admin should be able to assign users to own team', async () => {
    const team = await udaru.teams.create({
      name: 'Team 5',
      description: 'This is a test team',
      parentId: null,
      organizationId: 'WONKA',
      user: { id: 'test-admin', name: 'Test Admin' }
    })

    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${team.id}/users`,
      headers: {
        authorization: 'test-admin'
      },
      payload: {
        users: ['CharlieId', 'MikeId']
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result).to.equal({
      id: team.id,
      name: 'Team 5',
      description: 'This is a test team',
      path: team.path,
      organizationId: 'WONKA',
      usersCount: 3,
      users: [
        { id: 'CharlieId', name: 'Charlie Bucket' },
        { id: 'MikeId', name: 'Mike Teavee' },
        { id: 'test-admin', name: 'Test Admin' }
      ],
      policies: []
    })

    await udaru.teams.delete({ id: team.id, organizationId: team.organizationId })
    await udaru.users.delete({ id: 'test-admin', organizationId: team.organizationId })
  })

  lab.experiment('Teams - nest/un-nest', () => {
    let server = null

    lab.before(async () => {
      server = await serverFactory()
    })

    lab.test('Nest team should update the team path', async () => {
      const options = utils.requestOptions({
        method: 'PUT',
        url: '/authorization/teams/2/nest',
        payload: {
          parentId: '3'
        }
      })

      const response = await server.inject(options)
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.path).to.equal('3.2')

      await udaru.teams.move({ id: result.id, parentId: null, organizationId: result.organizationId })
    })

    lab.test('Un-nest team should update the team path', async () => {
      const res = await udaru.teams.move({ id: '2', parentId: '3', organizationId: 'WONKA' })

      const options = utils.requestOptions({
        method: 'PUT',
        url: `/authorization/teams/${res.id}/unnest`
      })

      const response = await server.inject(options)
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.path).to.equal('2')
    })
  })

  lab.experiment('Teams - manage policies', () => {
    let server = null

    lab.before(async () => {
      server = await serverFactory()
    })

    lab.test('Add one policy to a team', async () => {
      const options = utils.requestOptions({
        method: 'PUT',
        url: '/authorization/teams/1/policies',
        payload: {
          policies: [{id: 'policyId2'}]
        }
      })

      const response = await server.inject(options)
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
        { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {} },
        { id: 'policyId1', name: 'Director', version: '0.1', variables: {} }
      ])

      await udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId })
    })
  })

  lab.test('Add one policy with variables to a team', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{
          id: 'policyId2',
          variables: { var1: 'value1' }
        }]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: { var1: 'value1' } },
      { id: 'policyId1', name: 'Director', version: '0.1', variables: {} }
    ])

    await udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId })
  })

  lab.test('Policy instance addition, edit and removal', async () => {
    let options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/policies',
      payload: {
        policies: [{
          id: 'policyId2',
          variables: {var1: 'value1'}
        }]
      }
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
    ])

    const firstInstance = result.policies[0].instance

    options.payload = {
      policies: [{
        id: 'policyId2',
        variables: {var1: 'valueX'},
        instance: firstInstance
      }, {
        id: 'policyId2',
        variables: {var2: 'value2'}
      }, {
        id: 'policyId2',
        variables: {var3: 'value3'}
      }]
    }

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(3)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'valueX'} },
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var2: 'value2'} },
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var3: 'value3'} }
    ])

    options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/teams/2/policies/policyId2?instance=${firstInstance}`
    })

    response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/2`
    })

    response = await server.inject(options)
    result = response.result
    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(2)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.not.contain([
      { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
    ])

    options = utils.requestOptions({
      method: 'DELETE',
      url: `/authorization/teams/2/policies/policyId2`
    })

    response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/2`
    })

    response = await server.inject(options)
    result = response.result
    expect(response.statusCode).to.equal(200)
    expect(result.policies.length).to.equal(0)

    await udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId })
  })

  lab.test('Add to one team a policy with invalid ID should return an error', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'InvalidID'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Add one policy from another org to a team should return an error', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId9'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Add multiple policies to a team', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId4'}, {id: 'policyId5'}, {id: 'policyId6'}]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
      { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
      { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
      { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
      { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
    ])

    await udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId })
  })

  lab.test('List multiple policies', async () => {
    let options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId4'}, {id: 'policyId5'}, {id: 'policyId6'}]
      }
    })

    let response = await server.inject(options)
    let result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([
      { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
      { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
      { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
      { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
    ])

    options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/1/policies'
    })

    response = await server.inject(options)
    result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.data)).to.equal([
      { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
      { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
      { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
      { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
    ])

    options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/1/policies?limit=100&page=1'
    })

    response = await server.inject(options)
    result = response.result
    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.data)).to.equal([
      { id: 'policyId5', name: 'DB Admin', version: '0.1', variables: {} },
      { id: 'policyId6', name: 'DB Only Read', version: '0.1', variables: {} },
      { id: 'policyId1', name: 'Director', version: '0.1', variables: {} },
      { id: 'policyId4', name: 'Finance Director', version: '0.1', variables: {} }
    ])

    await udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' })
  })

  lab.test('get non existent teams policies', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/X/policies?limit=100&page=1'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(404)
  })

  lab.test('Replace team policies', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId6'}]
      }
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(utils.PoliciesWithoutInstance(result.policies)).to.equal([{
      id: 'policyId6',
      name: 'DB Only Read',
      version: '0.1',
      variables: {}
    }])

    await udaru.teams.replacePolicies({ id: result.id, policies: [{id: 'policyId1'}], organizationId: result.organizationId })
  })

  lab.test('Replace team policies with a policy with invalid ID should return an error', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'InvalidID'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Replace team policies from another org should return an error', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/1/policies',
      payload: {
        policies: [{id: 'policyId9'}]
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Delete team policies', async () => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    await udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' })
  })

  lab.test('Delete specific team policy', async () => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/teams/1/policies/policyId1'
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(204)

    await udaru.teams.replacePolicies({ id: '1', policies: [{id: 'policyId1'}], organizationId: 'WONKA' })
  })
})

lab.experiment('Teams - checking org_id scoping', () => {
  let teamId
  let server = null

  lab.before(async () => {
    server = await serverFactory()

    await udaru.organizations.create({ id: 'NEWORG', name: 'new org', description: 'new org' })
    const team = udaru.teams.create({ name: 'otherTeam', description: 'd', parentId: null, organizationId: 'NEWORG' })
    await udaru.users.create({ id: 'testUserId', name: 'testUser', organizationId: 'NEWORG' })
    teamId = team.id
  })

  lab.after(async () => {
    udaru.organizations.delete('NEWORG')
  })

  lab.test('Adding a user with invalid ID should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['invalidUserId']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Adding a user from another organization should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Adding multiple users from different organizations should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId', 'MikeId']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Adding a user with invalid ID should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['InvalidUserId']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('Replacing users from another organization should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/teams/2/users',
      payload: {
        users: ['testUserId', 'MikeId']
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('moving a team to another organization should not be permitted', async () => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: `/authorization/teams/${teamId}/nest`,
      payload: {
        parentId: '1'
      }
    })

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(400)
  })

  lab.test('get error if team does not exist', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/IDONTEXIST/nested`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(result.statusCode).to.equal(404)
    expect(result.error).to.exist()
    expect(result.message).to.include('not').include('found')
  })

  lab.test('get nested team list with default paging', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.greaterThan(1)
    expect(result.total).to.equal(1)
    expect(result.data).to.equal([
      {
        id: '6',
        name: 'Company Lawyer',
        description: 'Author of legal documents',
        parentId: '3',
        path: '6',
        organizationId: 'WONKA',
        usersCount: 0
      }
    ])
  })

  lab.test('get nested team list with paging', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=1&page=1'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.page).to.equal(1)
    expect(result.limit).to.equal(1)
    expect(result.total).to.equal(1)
    expect(result.data).to.equal([
      {
        id: '6',
        name: 'Company Lawyer',
        description: 'Author of legal documents',
        parentId: '3',
        path: '6',
        organizationId: 'WONKA',
        usersCount: 0
      }
    ])
  })

  lab.test('get nested team list with bad paging param', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=1&page=0'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.message).to.exist()
    expect(result.data).to.not.exist()
  })

  lab.test('get nested team list with bad limit param', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/teams/3/nested?limit=0&page=1'
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)
    expect(result.error).to.equal('Bad Request')
    expect(result.message).to.exist()
    expect(result.data).to.not.exist()
  })
})

lab.experiment('Teams User Search', () => {
  let server = null

  lab.before(async () => {
    server = await serverFactory()
  })

  lab.test('searching for a real user in an existing team', async () => {
    const teamId = '4'
    const query = 'Will'

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.data).to.exist()
    expect(result.total).to.exist()

    expect(result.data.length).to.equal(1)
    expect(result.total).to.equal(1)
  })

  lab.test('searching for a user that does not exist in an existing team', async () => {
    const teamId = '4'
    const query = 'IDONTEXIST'

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(200)
    expect(result.data).to.exist()
    expect(result.total).to.exist()

    expect(result.data.length).to.equal(0)
    expect(result.total).to.equal(0)
  })

  lab.test('searching for a real user in a non-existing team', async () => {
    const teamId = 'IDONTEXIST'
    const query = 'Will'

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users/search?query=${query}`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(404)
    expect(result.data).to.not.exist()
    expect(result.total).to.not.exist()

    expect(result.error).to.exist()
    expect(result.message).to.include('not').include('found')
  })

  lab.test('missing query string', async () => {
    const teamId = 'IDONTEXIST'

    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams/${teamId}/users/search?query=`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(400)

    expect(result.error).to.exist()
    expect(result.error.toLowerCase()).to.include('bad').include('request')
  })

  lab.test('missing team id param string', async () => {
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/teams//users/search?query='query'`
    })

    const response = await server.inject(options)
    const result = response.result

    expect(response.statusCode).to.equal(404)

    expect(result.error).to.exist()
    expect(result.message.toLowerCase()).to.include('not').include('found')
  })
})
