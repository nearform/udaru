'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const config = require('../../config')()
const utils = require('@nearform/udaru-test/utils')
const server = require('../test-server')
const udaru = require('@nearform/udaru-core')()

const defaultPageSize = config.get('authorization.defaultPageSize')
const statements = { Statement: [{ Effect: 'Allow', Action: ['documents:Read'], Resource: ['wonka:documents:/public/*'] }] }

const policyCreateData = {
  version: '2016-07-01',
  name: 'Documents Admin',
  statements,
  organizationId: 'WONKA'
}

lab.experiment('Users: read - delete - update', () => {
  lab.test('user list should have default pagination', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).greaterThan(1)
      expect(result.total).to.be.at.least(7)
      expect(result.data.length).to.equal(result.total)

      done()
    })
  })

  lab.test('get user list', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users?page=1&limit=3'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(7)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(3)
      expect(result.data.length).to.equal(3)
      expect(result.data[0]).to.equal({
        id: 'AugustusId',
        name: 'Augustus Gloop',
        organizationId: 'WONKA'
      })

      done()
    })
  })

  lab.test('no users list', (done) => {
    const options = {
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOEMEA'
      },
      method: 'GET',
      url: '/authorization/users'
    }

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(defaultPageSize)
      expect(result.total).to.equal(0)
      expect(result.data.length).to.equal(0)

      done()
    })
  })

  lab.test('get single user', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/AugustusId'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'AugustusId',
        name: 'Augustus Gloop',
        organizationId: 'WONKA',
        policies: [],
        teams: [
          {
            id: '1',
            name: 'Admins'
          }
        ]
      })

      done()
    })
  })

  lab.test('get single user with metadata', (done) => {
    const options = utils.requestOptions({
      method: 'GET',
      url: '/authorization/users/MikeId'
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'MikeId',
        name: 'Mike Teavee',
        organizationId: 'WONKA',
        metadata: {key1: 'val1', key2: 'val2'},
        policies: [],
        teams: []
      })

      done()
    })
  })

  lab.test('delete user should return 204 if success', (done) => {
    udaru.users.create({name: 'test', id: 'testId', organizationId: 'ROOT'}, (err, user) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'DELETE',
        url: '/authorization/users/testId',
        headers: {
          authorization: 'ROOTid'
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(204)
        expect(result).to.not.exist()

        done()
      })
    })
  })

  lab.test('update user should return 200 for success', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId',
      payload: {
        name: 'Modify you'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'ModifyId',
        name: 'Modify you',
        organizationId: 'WONKA',
        teams: [],
        policies: []
      })

      udaru.users.update({ name: 'Modify Me', id: 'ModifyId', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('update user with metadata field and 200ok response', (done) => {
    const metadata = {key1: 1, key2: 'y'}
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId',
      payload: {
        name: 'Modify you',
        metadata: metadata
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result).to.equal({
        id: 'ModifyId',
        name: 'Modify you',
        organizationId: 'WONKA',
        metadata: metadata,
        teams: [],
        policies: []
      })

      udaru.users.update({ name: 'Modify Me', id: 'ModifyId', organizationId: 'WONKA' }, done)
    })
  })
})

lab.experiment('Users - create', () => {
  lab.test('create user for a non existent organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'DOES_NOT_EXISTS'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.equal({
        error: 'Bad Request',
        message: `Organization 'DOES_NOT_EXISTS' does not exist`,
        statusCode: 400
      })

      done()
    })
  })

  lab.test('create user for a specific organization being a SuperUser', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('testId')
      expect(result.name).to.equal('Salman')
      expect(result.organizationId).to.equal('OILCOUSA')

      udaru.users.delete({ id: 'testId', organizationId: 'OILCOUSA' }, done)
    })
  })

  lab.test('create user for a specific organization being a SuperUser with some metadata', (done) => {
    const metadata = {key1: 1, key2: 'y'}
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'testId',
        metadata: metadata
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('testId')
      expect(result.name).to.equal('Salman')
      expect(result.organizationId).to.equal('OILCOUSA')
      expect(result.metadata).to.equal(metadata)

      udaru.users.delete({ id: 'testId', organizationId: 'OILCOUSA' }, done)
    })
  })

  lab.test('create user for a specific organization being a SuperUser but without specifying the user id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Salman')
      expect(result.organizationId).to.equal('OILCOUSA')

      udaru.users.delete({ id: result.id, organizationId: 'OILCOUSA' }, done)
    })
  })

  lab.test('create user for a specific organization being a SuperUser with a specified undefined user id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: undefined,
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Salman')
      expect(result.organizationId).to.equal('OILCOUSA')

      udaru.users.delete({ id: result.id, organizationId: 'OILCOUSA' }, done)
    })
  })

  lab.test('create user for a specific organization being a SuperUser but with specifying empty string user id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: '',
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create user for a specific organization being a SuperUser but with specifying null user id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: null,
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.equal('Bad Request')
      expect(result.id).to.not.exist()

      done()
    })
  })

  lab.test('create user for a specific organization being a SuperUser with an already used id', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        id: 'ROOTid',
        name: 'Salman'
      },
      headers: {
        authorization: 'ROOTid',
        org: 'OILCOUSA'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(409)
      expect(result.message).to.equal('Key (id)=(ROOTid) already exists.')

      done()
    })
  })

  lab.test('create user for the admin organization', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {
        name: 'Salman',
        id: 'U2FsbWFu'
      },
      headers: {
        authorization: 'ROOTid'
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(201)
      expect(result.id).to.equal('U2FsbWFu')
      expect(result.name).to.equal('Salman')
      expect(result.organizationId).to.equal('ROOT')

      udaru.users.delete({ id: result.id, organizationId: 'ROOT' }, done)
    })
  })

  lab.test('create user should return 400 bad request if input validation fails', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users',
      payload: {}
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result).to.include({
        statusCode: 400,
        error: 'Bad Request'
      })

      done()
    })
  })
})

lab.experiment('Users - manage policies', () => {
  lab.test('add policies to a user', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: '/authorization/users/ModifyId/policies',
        payload: {
          policies: [p.id]
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.policies[0].id).to.equal(p.id)

        udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' }, (err, res) => {
          expect(err).to.not.exist()

          udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('add policies with variables to a user', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'PUT',
        url: '/authorization/users/ModifyId/policies',
        payload: {
          policies: [{
            id: p.id,
            variables: {var1: 'value1'}
          }]
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.policies[0].id).to.equal(p.id)
        expect(result.policies[0].variables).to.equal({var1: 'value1'})

        udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' }, (err, res) => {
          expect(err).to.not.exist()

          udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
        })
      })
    })
  })

  lab.test('Policy instance addition and removal', (done) => {
    let options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/VerucaId/policies',
      payload: {policies: []}
    })

    server.inject(options, (response) => {
      const { result } = response

      expect(response.statusCode).to.equal(200)
      expect(result.policies.length).to.equal(0)

      options = utils.requestOptions({
        method: 'PUT',
        url: '/authorization/users/VerucaId/policies',
        payload: {
          policies: [{
            id: 'policyId2',
            variables: {var1: 'value1'}
          }]
        }
      })

      server.inject(options, (response) => {
        const { result } = response

        expect(response.statusCode).to.equal(200)
        expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
          { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
        ])

        const firstInstance = result.policies[0].instance

        options.payload = {
          policies: [{
            id: 'policyId2',
            variables: {var2: 'value2'}
          }, {
            id: 'policyId2',
            variables: {var3: 'value3'}
          }]
        }

        server.inject(options, (response) => {
          const { result } = response

          expect(response.statusCode).to.equal(200)
          expect(result.policies.length).to.equal(3)
          expect(utils.PoliciesWithoutInstance(result.policies)).to.contain([
            { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var3: 'value3'} }
          ])

          options = utils.requestOptions({
            method: 'DELETE',
            url: `/authorization/users/VerucaId/policies/policyId2?instance=${firstInstance}`
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(204)

            options = utils.requestOptions({
              method: 'GET',
              url: `/authorization/users/VerucaId`
            })

            server.inject(options, (response) => {
              const { result } = response
              expect(response.statusCode).to.equal(200)
              expect(result.policies.length).to.equal(2)
              expect(utils.PoliciesWithoutInstance(result.policies)).to.not.contain([
                { id: 'policyId2', name: 'Accountant', version: '0.1', variables: {var1: 'value1'} }
              ])

              options = utils.requestOptions({
                method: 'DELETE',
                url: `/authorization/users/VerucaId/policies/policyId2`
              })

              server.inject(options, (response) => {
                expect(response.statusCode).to.equal(204)

                options = utils.requestOptions({
                  method: 'GET',
                  url: `/authorization/users/VerucaId`
                })

                server.inject(options, (response) => {
                  const { result } = response
                  expect(response.statusCode).to.equal(200)
                  expect(result.policies.length).to.equal(0)

                  udaru.users.replacePolicies({ id: result.id, policies: ['policyId2'], organizationId: result.organizationId }, done)
                })
              })
            })
          })
        })
      })
    })
  })

  lab.test('add policy with invalid ID to a user', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('replace policies with a policy with invalid ID should return an error', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: ['InvalidPolicyID']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('clear and replace policies for a user', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      const options = utils.requestOptions({
        method: 'POST',
        url: '/authorization/users/ModifyId/policies',
        payload: {
          policies: [p.id]
        }
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.policies.length).to.equal(1)
        expect(result.policies[0].id).to.equal(p.id)

        udaru.policies.create(policyCreateData, (err, newP) => {
          expect(err).to.not.exist()

          options.payload.policies = [newP.id]

          server.inject(options, (response) => {
            const result = response.result

            expect(response.statusCode).to.equal(200)
            expect(result.policies.length).to.equal(1)
            expect(result.policies[0].id).to.equal(newP.id)

            udaru.users.deletePolicies({ id: 'ModifyId', organizationId: 'WONKA' }, (err, res) => {
              expect(err).to.not.exist()

              udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, (err, res) => {
                expect(err).to.not.exist()

                udaru.policies.delete({ id: newP.id, organizationId: 'WONKA' }, done)
              })
            })
          })
        })
      })
    })
  })

  lab.test('remove all user\'s policies', (done) => {
    const options = utils.requestOptions({
      method: 'DELETE',
      url: '/authorization/users/ModifyId/policies'
    })

    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      udaru.users.addPolicies({ id: 'ModifyId', organizationId: 'WONKA', policies: [p.id] }, (err) => {
        expect(err).to.not.exist()

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(204)

          udaru.users.read({ id: 'ModifyId', organizationId: 'WONKA' }, (err, user) => {
            expect(err).not.to.exist()
            expect(user.policies).to.equal([])

            udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
          })
        })
      })
    })
  })

  lab.test('remove one user\'s policies', (done) => {
    udaru.policies.create(policyCreateData, (err, p) => {
      expect(err).to.not.exist()

      udaru.users.addPolicies({ id: 'ModifyId', organizationId: 'WONKA', policies: [p.id] }, (err) => {
        expect(err).to.not.exist()

        const options = utils.requestOptions({
          method: 'DELETE',
          url: `/authorization/users/ModifyId/policies/${p.id}`
        })

        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(204)

          udaru.users.read({ id: 'ModifyId', organizationId: 'WONKA' }, (err, user) => {
            expect(err).not.to.exist()
            expect(user.policies).to.equal([])

            udaru.policies.delete({ id: p.id, organizationId: 'WONKA' }, done)
          })
        })
      })
    })
  })
})

lab.experiment('Users - checking org_id scoping', () => {
  let policyId

  lab.before((done) => {
    udaru.organizations.create({ id: 'NEWORG', name: 'new org', description: 'new org' }, (err, org) => {
      if (err) return done(err)

      const policyData = {
        version: '1',
        name: 'Documents Admin',
        organizationId: 'NEWORG',
        statements
      }

      udaru.policies.create(policyData, (err, policy) => {
        if (err) return done(err)

        policyId = policy.id
        done()
      })
    })
  })

  lab.after((done) => {
    udaru.organizations.delete('NEWORG', done)
  })

  lab.test('add policies from a different organization should not be allowed', (done) => {
    const options = utils.requestOptions({
      method: 'PUT',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [policyId]
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })

  lab.test('replace policies from a different organization should not be allowed', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/policies',
      payload: {
        policies: [policyId]
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      done()
    })
  })
})

lab.experiment('Users - manage teams', () => {
  lab.test('get user teams', (done) => {
    const userId = 'VerucaId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(2)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(defaultPageSize)
      expect(result.data.length).to.equal(2)
      let expectedTeams = [
        'Authors',
        'Readers'
      ]
      expect(_.map(result.data, 'name')).to.only.contain(expectedTeams)

      done()
    })
  })

  lab.test('get user teams, invalid userId', (done) => {
    const userId = 'invalidid'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(result.statusCode).to.equal(404)
      expect(result.data).to.not.exist()
      expect(result.total).to.not.exist()
      expect(result.error).to.exist()
      expect(result.message).to.exist()
      expect(result.message.toLowerCase()).to.include(userId).include('not').include('found')

      done()
    })
  })

  lab.test('get user teams, user in no teams', (done) => {
    const userId = 'ModifyId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(0)
      expect(result.page).to.equal(1)
      expect(result.limit).to.equal(defaultPageSize)
      expect(result.data.length).to.equal(0)

      done()
    })
  })

  lab.test('get user teams, paginated', (done) => {
    const userId = 'VerucaId'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/${userId}/teams?page=2&limit=1`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(2)
      expect(result.page).to.equal(2)
      expect(result.limit).to.equal(1)
      expect(result.data.length).to.equal(1)
      let expectedTeams = [
        'Readers'
      ]
      expect(_.map(result.data, 'name')).contains(expectedTeams)

      done()
    })
  })

  lab.test('replace users teams', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/ModifyId/teams',
      payload: {
        teams: ['2', '3']
      }
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.id).to.equal('ModifyId')
      expect(result.teams).to.equal([{ id: '3', name: 'Authors' }, { id: '2', name: 'Readers' }])

      udaru.users.deleteTeams({ id: result.id, organizationId: result.organizationId, teams: [] }, done)
    })
  })

  lab.test('replace users teams for non-existent user', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/xyz/teams',
      payload: {
        teams: ['2', '3']
      }
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      expect(response.result.message).to.equal('User xyz not found')
      done()
    })
  })

  lab.test('replace users teams for non-existent user (bad format)', (done) => {
    const options = utils.requestOptions({
      method: 'POST',
      url: '/authorization/users/xyz/teams',
      payload: ['1']
    })

    server.inject(options, (response) => {
      expect(response.statusCode).to.equal(400)
      expect(response.result.message).to.equal('No teams found in payload')
      done()
    })
  })

  lab.test('Delete user from her teams', (done) => {
    udaru.users.replaceTeams({ id: 'ModifyId', organizationId: 'WONKA', teams: ['2', '3'] }, (err, user) => {
      if (err) return done(err)

      const options = utils.requestOptions({
        method: 'DELETE',
        url: '/authorization/users/ModifyId/teams'
      })

      server.inject(options, (response) => {
        const result = response.result

        expect(response.statusCode).to.equal(200)
        expect(result.id).to.equal('ModifyId')
        expect(result.teams).to.equal([])

        done()
      })
    })
  })
})

lab.experiment('Users - search for user', () => {
  lab.test(`search with empty query`, (done) => {
    const query = ''
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(400)
      expect(result.error).to.exist()
      expect(result.validation).to.exist()
      expect(result.error.toLowerCase()).to.include('bad').include('request')

      done()
    })
  })

  lab.test(`search with query value 'm'`, (done) => {
    const query = 'm'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    server.inject(options, (response) => {
      const result = response.result
      const expectedUsers = [
        'Many Polices',
        'Mike Teavee',
        'Modify Me'
      ]

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(3)
      expect(result.data.length).to.equal(3)

      expect(_.map(result.data, 'name')).to.only.contain(expectedUsers)
      expect(result.data.every(d => d.organizationId === 'WONKA')).to.be.true()

      done()
    })
  })

  lab.test(`search with query value 'IDONTEXIST'`, (done) => {
    const query = 'IDONTEXIST'
    const options = utils.requestOptions({
      method: 'GET',
      url: `/authorization/users/search?query=${query}`
    })

    server.inject(options, (response) => {
      const result = response.result

      expect(response.statusCode).to.equal(200)
      expect(result.total).to.equal(0)
      expect(result.data.length).to.equal(0)

      done()
    })
  })
})
