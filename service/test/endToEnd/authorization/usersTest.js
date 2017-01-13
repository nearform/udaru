const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const utils = require('../../utils')
const userOps = require('../../../lib/ops/userOps')
const policyOps = require('../../../lib/ops/policyOps')
const teamOps = require('../../../lib/ops/teamOps')
const server = require('./../../../wiring-hapi')


lab.experiment('Routes Authorizations', () => {
  lab.experiment('users', () => {
    lab.experiment('GET /user/:id', () => {

      const organizationId = 'WONKA'
      let callerId
      let calledId
      let calledTeamId
      let policyId

      function Policy (Statement) {
        return {
          id: policyId || null,
          version: '2016-07-01',
          name: 'Test Policy',
          statements: JSON.stringify({
            Statement: Statement || [{
              Effect: 'Allow',
              Action: ['dummy'],
              Resource: ['dummy']
            }]
          }),
          organizationId
        }
      }

      lab.before((done) => {
        userOps.createUser({ name: 'caller', organizationId }, (err, caller) => {
          if (err) return done(err)
          callerId = caller.id

          userOps.createUser({ name: 'called', organizationId }, (err, called) => {
            if (err) return done(err)
            calledId = called.id

            teamOps.createTeam({ name: 'called team', organizationId }, (err, team) => {
              if (err) return done(err)
              calledTeamId = team.id

              teamOps.addUsersToTeam({ id: calledTeamId, users: [calledId], organizationId }, (err) => {
                if (err) return done(err)

                const policyCreateData = Policy()

                policyOps.createPolicy(policyCreateData, (err, policy) => {
                  if (err) return done(err)
                  policyId = policy.id

                  userOps.addUserPolicies({ id: callerId, organizationId, policies: [policyId] }, done)
                })
              })
            })
          })
        })
      })

      lab.after((done) => {
        userOps.deleteUser({ id: callerId, organizationId }, (err) => {
          if (err) return done(err)
          userOps.deleteUser({ id: calledId, organizationId }, (err) => {
            if (err) return done(err)
            teamOps.deleteTeam({ id: calledTeamId, organizationId }, (err) => {
              if (err) return done(err)
              policyOps.deletePolicy({ id: policyId, organizationId }, done)
            })
          })
        })
      })

      lab.test('should allow caller with policy for specific users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: [`/authorization/user/WONKA/*/${calledId}`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${calledId}`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test.skip('should allow caller with policy for all users in specific team', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: [`/authorization/user/WONKA/${calledTeamId}/*`]
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${calledId}`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should allow caller with policy for all users', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:read'],
          Resource: ['/authorization/user/WONKA/*']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${calledId}`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(200)
            done()
          })
        })
      })

      lab.test('should not allow caller without a correct policy', (done) => {

        const policyData = Policy([{
          Effect: 'Allow',
          Action: ['authorization:users:dummy'],
          Resource: ['/authorization/user/WONKA/*/dummy']
        }])

        policyOps.updatePolicy(policyData, (err, policy) => {
          if (err) return done(err)

          const options = utils.requestOptions({
            method: 'GET',
            url: `/authorization/users/${calledId}`,
            headers: { authorization: callerId }
          })

          server.inject(options, (response) => {
            expect(response.statusCode).to.equal(403)
            done()
          })
        })
      })
    })
  })
})
