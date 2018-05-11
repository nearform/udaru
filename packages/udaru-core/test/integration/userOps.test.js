'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const u = require('../testUtils')
const udaru = require('../..')()

lab.experiment('UserOps', () => {
  let wonkaTeams
  let wonkaPolicies

  lab.before(done => {
    udaru.teams.list({organizationId: 'WONKA'}, (err, teams) => {
      if (err) return done(err)
      wonkaTeams = teams

      udaru.policies.list({organizationId: 'WONKA'}, (err, policies) => {
        if (err) return done(err)
        wonkaPolicies = policies

        done()
      })
    })
  })

  lab.test('list of org users', (done) => {
    udaru.users.list({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      let expectedUserIds = [
        'AugustusId',
        'CharlieId',
        'ManyPoliciesId',
        'MikeId',
        'ModifyId',
        'VerucaId',
        'WillyId'
      ]
      expect(_.map(result, 'id')).contains(expectedUserIds)

      done()
    })
  })

  lab.test('create and delete a user by ID', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: 'testId', name: 'Mike Teavee', organizationId: 'WONKA', teams: [], policies: [] })

      udaru.users.delete({ id: 'testId', organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create, update and read user with meta', (done) => {
    const meta1 = {keya: 'vala', keyb: 'valb'}
    const meta2 = {keyx: 'valx', keyy: 'valy'}

    const userData = {
      id: 'testMeta',
      name: 'Meta Name',
      organizationId: 'WONKA',
      metadata: meta1
    }

    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal({ id: userData.id,
        name: userData.name,
        organizationId: userData.organizationId,
        metadata: meta1,
        teams: [],
        policies: []})

      udaru.users.update({id: userData.id,
        organizationId: userData.organizationId,
        name: 'Meta 2',
        metadata: meta2}
        , (err, result) => {
        expect(err).to.not.exist()

        udaru.users.read({id: userData.id,
          organizationId: userData.organizationId},
        (err, result) => {
          expect(err).to.not.exist()
          expect(result).to.exist()
          expect(result).to.equal({ id: userData.id,
            name: 'Meta 2',
            organizationId: userData.organizationId,
            metadata: meta2,
            teams: [],
            policies: []
          })
          udaru.users.delete({ id: userData.id, organizationId: userData.organizationId }, done)
        })
      })
    })
  })

  lab.test('create an user with the same id should fail second time', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()

      udaru.users.create(userData, (err, result) => {
        expect(err).to.exist()
        expect(err.output.statusCode).to.equal(409)
        expect(err.message).to.equal('Key (id)=(testId) already exists.')

        udaru.users.delete({ id: 'testId', organizationId: 'WONKA' }, done)
      })
    })
  })

  lab.test('create a user with an invalid id should fail', (done) => {
    const userData = {
      id: 'id & with \\ invalid $ chars',
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }

    udaru.users.create(userData, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.equal('child "id" fails because ["id" with value "id & with \\ invalid $ chars" fails to match the required pattern: /^[A-Za-z0-9-]+$/]')

      done()
    })
  })

  lab.test('create a user with long name should fail', (done) => {
    const userName = 'a'.repeat(256)
    udaru.users.create({ organizationId: 'WONKA', name: userName, id: 'longtestid' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(400)
      expect(err.message).to.match(/length must be less than/)

      done()
    })
  })

  lab.test('create and delete a user without specifying an id', (done) => {
    const userData = {
      name: 'Mike Teavee',
      organizationId: 'WONKA'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.id).to.not.be.null()
      expect(result.name).to.equal('Mike Teavee')
      expect(result.organizationId).to.equal('WONKA')
      expect(result.teams).to.equal([])
      expect(result.policies).to.equal([])

      udaru.users.delete({ id: result.id, organizationId: 'WONKA' }, done)
    })
  })

  lab.test('create user in not existing organization', (done) => {
    const userData = {
      id: 'testId',
      name: 'Mike Teavee',
      organizationId: 'DO_NOT_EXIST_ORG'
    }
    udaru.users.create(userData, (err, result) => {
      expect(err).to.exist()
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('update a user', (done) => {
    const data = {
      id: 'AugustusId',
      organizationId: 'WONKA',
      name: 'Augustus Gloop new'
    }

    udaru.users.update(data, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.name).to.equal('Augustus Gloop new')

      udaru.users.update({ id: 'AugustusId', organizationId: 'WONKA', name: 'Augustus Gloop' }, done)
    })
  })

  lab.test('read a specific user', (done) => {
    let authorsTeam = u.findPick(wonkaTeams, {name: 'Authors'}, ['id', 'name'])
    let readersTeam = u.findPick(wonkaTeams, {name: 'Readers'}, ['id', 'name'])
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    const expected = {
      id: 'VerucaId',
      name: 'Veruca Salt',
      organizationId: 'WONKA',
      teams: [
        authorsTeam,
        readersTeam
      ],
      policies: [{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }]
    }
    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      result.policies = u.PoliciesWithoutInstance(result.policies)
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('getUserOrganizationId', (done) => {
    const expected = 'WONKA'
    udaru.getUserOrganizationId('VerucaId', (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result).to.equal(expected)

      done()
    })
  })

  lab.test('read a specific user that does not exist', (done) => {
    udaru.users.read({ id: '987654321', organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.exist()
      expect(err.output.statusCode).to.equal(404)
      expect(result).to.not.exist()

      done()
    })
  })

  lab.test('replace user\'s policies', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.replacePolicies({
        id: 'VerucaId',
        policies: [{id: directorPolicy.id}, {id: sysadminPolicy.id}],
        organizationId: 'WONKA'
      }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(2)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {}
        }, {
          id: sysadminPolicy.id,
          name: sysadminPolicy.name,
          version: sysadminPolicy.version,
          variables: {}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('replace user\'s policies with variables', (done) => {
    const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    const directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    const sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.replacePolicies({
        id: 'VerucaId',
        policies: [{
          id: directorPolicy.id
        }, {
          id: sysadminPolicy.id,
          variables: {var1: 'value1'}
        }],
        organizationId: 'WONKA'
      }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(2)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {}
        }, {
          id: sysadminPolicy.id,
          name: sysadminPolicy.name,
          version: sysadminPolicy.version,
          variables: {var1: 'value1'}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('replace with shared policies', (done) => {
    const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.replacePolicies({
        id: 'VerucaId',
        policies: [{id: 'sharedPolicyId1'}],
        organizationId: 'WONKA'
      }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: 'sharedPolicyId1',
          name: 'Shared policy from fixtures',
          version: '0.1',
          variables: {}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.addPolicies({ id: 'VerucaId', policies: [{id: directorPolicy.id}, {id: sysadminPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }, {
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {}
        }, {
          id: sysadminPolicy.id,
          name: sysadminPolicy.name,
          version: sysadminPolicy.version,
          variables: {}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('add policies with variables to user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      const policies = [{
        id: directorPolicy.id,
        variables: {var1: 'value1'}
      }, {
        id: sysadminPolicy.id,
        variables: {var2: 'value2'}
      }]

      udaru.users.addPolicies({ id: 'VerucaId', policies, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(3)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }, {
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {var1: 'value1'}
        }, {
          id: sysadminPolicy.id,
          name: sysadminPolicy.name,
          version: sysadminPolicy.version,
          variables: {var2: 'value2'}
        }])
        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('get policies list from user', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
    let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
    let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      const policies = [{
        id: directorPolicy.id,
        variables: {var1: 'value1'}
      }, {
        id: sysadminPolicy.id,
        variables: {var2: 'value2'}
      }]

      udaru.users.addPolicies({ id: 'VerucaId', policies, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(3)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }, {
          id: directorPolicy.id,
          name: directorPolicy.name,
          version: directorPolicy.version,
          variables: {var1: 'value1'}
        }, {
          id: sysadminPolicy.id,
          name: sysadminPolicy.name,
          version: sysadminPolicy.version,
          variables: {var2: 'value2'}
        }])

        udaru.users.listPolicies({ id: user.id, organizationId: 'WONKA' }, (err, list) => {
          expect(err).to.not.exist()
          expect(list.data).to.exist()
          expect(list.data.length).to.equal(3)
          expect(u.PoliciesWithoutInstance(list.data)).to.only.include([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {}
          }, {
            id: directorPolicy.id,
            name: directorPolicy.name,
            version: directorPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: sysadminPolicy.id,
            name: sysadminPolicy.name,
            version: sysadminPolicy.version,
            variables: {var2: 'value2'}
          }])

          // again with pagination params
          udaru.users.listPolicies({ id: user.id, organizationId: 'WONKA', limit: 100, page: 1 }, (err, list) => {
            expect(err).to.not.exist()
            expect(list.data).to.exist()
            expect(list.data.length).to.equal(3)
            expect(u.PoliciesWithoutInstance(list.data)).to.only.include([{
              id: accountantPolicy.id,
              name: accountantPolicy.name,
              version: accountantPolicy.version,
              variables: {}
            }, {
              id: directorPolicy.id,
              name: directorPolicy.name,
              version: directorPolicy.version,
              variables: {var1: 'value1'}
            }, {
              id: sysadminPolicy.id,
              name: sysadminPolicy.name,
              version: sysadminPolicy.version,
              variables: {var2: 'value2'}
            }])

            udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
              expect(err).to.not.exist()
              done()
            })
          })
        })
      })
    })
  })

  lab.test('get policies list from non existant user', (done) => {
    udaru.users.listPolicies({ id: 'doesntexist', organizationId: 'WONKA' }, (err, list) => {
      expect(err).to.not.exist()
      expect(list.data).to.exist()
      expect(list.data).to.have.length(0)
      done()
    })
  })

  lab.test('test addition and deletion of policies instances with variables', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])
      const firstInstance = user.policies[0].instance

      const policies = [{
        id: accountantPolicy.id,
        variables: {var1: 'val1'}
      }, {
        id: accountantPolicy.id,
        variables: {var2: 'val2'}
      }]

      udaru.users.addPolicies({ id: 'VerucaId', policies, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(3)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {var2: 'val2'}
        }])

        // delete instance only
        udaru.users.deletePolicy({ userId: 'VerucaId', policyId: accountantPolicy.id, instance: firstInstance, organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var2: 'val2'}
          }])

          // delete remaining, no instance param
          udaru.users.deletePolicy({ userId: 'VerucaId', policyId: accountantPolicy.id, organizationId: 'WONKA' }, (err, user) => {
            expect(err).to.not.exist()
            expect(user).to.exist()
            expect(user.policies.length).to.equal(0)

            udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
              expect(err).to.not.exist()
              done()
            })
          })
        })
      })
    })
  })

  lab.test('add shared policies to user', (done) => {
    const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.addPolicies({ id: 'VerucaId', policies: [{id: 'sharedPolicyId1'}], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies.length).to.equal(2)
        expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }, {
          id: 'sharedPolicyId1',
          name: 'Shared policy from fixtures',
          version: '0.1',
          variables: {}
        }])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete user\'s policies', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.deletePolicies({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.test('delete specific user\'s policy', (done) => {
    let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

    udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
      expect(err).to.not.exist()
      expect(user).to.exist()
      expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
        id: accountantPolicy.id,
        name: accountantPolicy.name,
        version: accountantPolicy.version,
        variables: {}
      }])

      udaru.users.deletePolicy({ userId: 'VerucaId', policyId: accountantPolicy.id, organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(user.policies).to.equal([])

        udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
          expect(err).to.not.exist()
          done()
        })
      })
    })
  })

  lab.experiment('multiple instance tests', () => {
    lab.test('same policy without variables should 409 conflict', (done) => {
      let accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
      let directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])
      let sysadminPolicy = u.findPick(wonkaPolicies, {name: 'Sys admin'}, ['id', 'name', 'version'])

      udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }])

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies: [
            {id: accountantPolicy.id},
            {id: directorPolicy.id},
            {id: sysadminPolicy.id}
          ],
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.exist()
          expect(err.output.statusCode).to.equal(409)

          udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })

    lab.test('same policy with different variables should 409 conflict', (done) => {
      const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
      const directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])

      udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }])

        const policies = [{
          id: accountantPolicy.id,
          variables: {var1: 'value1'}
        }, {
          id: directorPolicy.id,
          variables: {var2: 'value2'}
        }]

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies,
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(3)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {}
          }, {
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: directorPolicy.id,
            name: directorPolicy.name,
            version: directorPolicy.version,
            variables: {var2: 'value2'}
          }])
          udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })

    lab.test('with different variables should add twice', (done) => {
      const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])
      const directorPolicy = u.findPick(wonkaPolicies, {name: 'Director'}, ['id', 'name', 'version'])

      udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }])

        const policies = [{
          id: accountantPolicy.id,
          variables: {var1: 'value1'}
        }, {
          id: directorPolicy.id,
          variables: {var2: 'value2'}
        }]

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies,
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(3)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {}
          }, {
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: directorPolicy.id,
            name: directorPolicy.name,
            version: directorPolicy.version,
            variables: {var2: 'value2'}
          }])

          udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
            expect(err).to.not.exist()
            done()
          })
        })
      })
    })

    lab.test('amend instances', (done) => {
      const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

      udaru.users.replacePolicies({ id: 'VerucaId', policies: [], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user.policies.length).to.equal(0)

        const policies = [{
          id: accountantPolicy.id,
          variables: {var1: 'value1'}
        }, {
          id: accountantPolicy.id,
          variables: {var2: 'value2'}
        }]

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies,
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var2: 'value2'}
          }])

          const instance1 = user.policies[0].instance
          const instance2 = user.policies[1].instance

          const policies = [{
            id: accountantPolicy.id,
            instance: instance1,
            variables: {var1: 'valuex'}
          }, {
            id: accountantPolicy.id,
            instance: instance2,
            variables: {var2: 'valuey'}
          }]

          udaru.users.amendPolicies({
            id: 'VerucaId',
            policies,
            organizationId: 'WONKA'
          }, (err, user) => {
            expect(err).to.not.exist()
            expect(user).to.exist()
            expect(user.policies.length).to.equal(2)
            expect(user.policies).to.contain([{
              id: accountantPolicy.id,
              name: accountantPolicy.name,
              version: accountantPolicy.version,
              variables: {var1: 'valuex'},
              instance: instance1
            }, {
              id: accountantPolicy.id,
              name: accountantPolicy.name,
              version: accountantPolicy.version,
              variables: {var2: 'valuey'},
              instance: instance2
            }])

            udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
              expect(err).to.not.exist()
              done()
            })
          })
        })
      })
    })

    lab.test('amend instances 409', (done) => {
      const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

      udaru.users.replacePolicies({ id: 'VerucaId', policies: [], organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user.policies.length).to.equal(0)

        const policies = [{
          id: accountantPolicy.id,
          variables: {var1: 'value1'}
        }, {
          id: accountantPolicy.id,
          variables: {var2: 'value2'}
        }]

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies,
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var1: 'value1'}
          }, {
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var2: 'value2'}
          }])

          const instance1 = user.policies[0].instance
          const instance2 = user.policies[1].instance

          const policies = [{
            id: accountantPolicy.id,
            instance: instance1,
            variables: {var1: 'value1'}
          }, {
            id: accountantPolicy.id,
            instance: instance2,
            variables: {var1: 'value1'}
          }]

          udaru.users.amendPolicies({
            id: 'VerucaId',
            policies,
            organizationId: 'WONKA'
          }, (err, user) => {
            expect(err).to.exist()
            expect(err.output.statusCode).to.equal(409)

            udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
              expect(err).to.not.exist()
              done()
            })
          })
        })
      })
    })

    lab.test('with same variables should 409 conflict', (done) => {
      const accountantPolicy = u.findPick(wonkaPolicies, {name: 'Accountant'}, ['id', 'name', 'version'])

      udaru.users.read({ id: 'VerucaId', organizationId: 'WONKA' }, (err, user) => {
        expect(err).to.not.exist()
        expect(user).to.exist()
        expect(u.PoliciesWithoutInstance(user.policies)).to.equal([{
          id: accountantPolicy.id,
          name: accountantPolicy.name,
          version: accountantPolicy.version,
          variables: {}
        }])

        const policies = [{
          id: accountantPolicy.id,
          variables: {var1: 'value1'}
        }]

        udaru.users.addPolicies({
          id: 'VerucaId',
          policies,
          organizationId: 'WONKA'
        }, (err, user) => {
          expect(err).to.not.exist()
          expect(user).to.exist()
          expect(user.policies.length).to.equal(2)
          expect(u.PoliciesWithoutInstance(user.policies)).to.contain([{
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {}
          }, {
            id: accountantPolicy.id,
            name: accountantPolicy.name,
            version: accountantPolicy.version,
            variables: {var1: 'value1'}
          }])

          udaru.users.addPolicies({
            id: 'VerucaId',
            policies,
            organizationId: 'WONKA'
          }, (err, user) => {
            expect(err).to.exist()
            expect(err.output.statusCode).to.equal(409)

            udaru.users.replacePolicies({ id: 'VerucaId', policies: [{id: accountantPolicy.id}], organizationId: 'WONKA' }, (err, user) => {
              expect(err).to.not.exist()
              done()
            })
          })
        })
      })
    })
  })
})

lab.experiment('UserOps structure', () => {
  lab.test('Validate existing test teams', (done) => {
    udaru.teams.list({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      let expectedTeams = [
        'Admins',
        'Readers',
        'Authors',
        'Managers'
      ]
      expect(_.map(result, 'name')).contains(expectedTeams)

      done()
    })
  })

  lab.test('Validate existing org user', (done) => {
    udaru.users.list({ organizationId: 'WONKA' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.exist()
      let expectedUsers = [
        'VerucaId'
      ]
      expect(_.map(result, 'id')).contains(expectedUsers)

      done()
    })
  })

  lab.test('Test user exists in two teams, no pagination', (done) => {
    udaru.users.listUserTeams({ id: 'VerucaId', organizationId: 'WONKA' }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(data).to.exist()
      let expectedTeams = [
        'Readers',
        'Authors'
      ]
      expect(_.map(data, 'name')).contains(expectedTeams)
      expect(total).to.equal(2)
      expect(data.length).to.equal(2)

      done()
    })
  })

  lab.test('Test incorrect pagination', (done) => {
    udaru.users.listUserTeams({ id: 'VerucaId', organizationId: 'WONKA', page: 0 }, (err, data, total) => {
      expect(err).to.exist()
      expect(err.message.indexOf('page')).to.be.at.least(0)
      expect(err.message.indexOf('limit')).to.be.below(0)
      expect(data).to.not.exist()
      expect(total).to.not.exist()

      done()
    })
  })

  lab.test('Test incorrect limit', (done) => {
    udaru.users.listUserTeams({ id: 'VerucaId', organizationId: 'WONKA', page: 1, limit: 0 }, (err, data, total) => {
      expect(err).to.exist()
      expect(err.message.indexOf('page')).to.be.below(0)
      expect(err.message.indexOf('limit')).to.be.at.least(0)
      expect(data).to.not.exist()
      expect(total).to.not.exist()

      done()
    })
  })

  lab.test('Test user exists in two teams, pagination', (done) => {
    udaru.users.listUserTeams({ id: 'VerucaId', organizationId: 'WONKA', page: 2, limit: 1 }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(data).to.exist()
      let expectedTeams = [
        'Readers'
      ]
      expect(_.map(data, 'name')).contains(expectedTeams)
      expect(total).to.equal(2)
      expect(data.length).to.equal(1)

      done()
    })
  })

  lab.test('Test user exists in two teams, pagination', (done) => {
    udaru.users.listUserTeams({ id: 'VerucaId', organizationId: 'WONKA', page: 2, limit: 10 }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(data).to.exist()
      expect(total).to.equal(2)
      expect(data.length).to.equal(0)

      done()
    })
  })

  lab.test('Test no teams', (done) => {
    udaru.users.listUserTeams({ id: 'InvalidId', organizationId: 'WONKA' }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(total).to.exist()
      expect(total).to.equal(0)
      expect(data.length).to.equal(0)

      done()
    })
  })

  lab.test('Search for Charlie', (done) => {
    udaru.users.search({ query: 'Charlie', organizationId: 'WONKA' }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(total).to.exist()
      expect(total).to.equal(1)
      expect(data.length).to.equal(1)

      done()
    })
  })

  // Lot's of options, see https://www.postgresql.org/docs/current/static/textsearch-controls.html
  lab.test('Wildcard search for Charlie', (done) => {
    udaru.users.search({ query: 'Charli', organizationId: 'WONKA' }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(total).to.exist()
      expect(total).to.equal(1)
      expect(data.length).to.equal(1)

      done()
    })
  })

  lab.test('Search with bad org id', (done) => {
    udaru.users.search({ query: 'Charlie', organizationId: 'IDONTEXIST' }, (err, data, total) => {
      expect(err).to.not.exist()
      expect(total).to.exist()
      expect(total).to.equal(0)
      expect(data.length).to.equal(0)

      done()
    })
  })

  lab.test('Search expect error with bad params', (done) => {
    udaru.users.search({ querty: 'Bad query param', orId: 'Bad organizationId param' }, (err, data, total) => {
      expect(err).to.exist()

      done()
    })
  })

  lab.test('Search sql injection org_id sanity check', (done) => {
    udaru.users.search({ query: 'Charlie', organizationId: 'WONKA||org_id<>-1' }, (err, data, total) => {
      expect(err).to.exist()
      done()
    })
  })

  lab.test('Search sql injection query sanity check', (done) => {
    udaru.users.search({ query: 'Charlie\');drop database authorization;', organizationId: 'WONKA' }, (err, data, total) => {
      expect(err).to.exist()

      done()
    })
  })
})
