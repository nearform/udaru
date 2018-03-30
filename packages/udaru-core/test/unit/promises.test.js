'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const udaru = require('../..')()

const organizationId = 'WONKA'

lab.experiment('Promises', () => {
  let testUserId

  lab.before((done) => {
    udaru.policies.list({organizationId}, (err, policies) => {
      if (err) return done(err)

      udaru.users.create({name: 'Salman', organizationId}, (err, result) => {
        if (err) return done(err)

        testUserId = result.id
        udaru.users.replacePolicies({ id: testUserId, policies: [_.find(policies, {name: 'Director'}).id], organizationId }, done)
      })
    })
  })

  lab.after((done) => {
    udaru.users.delete({id: testUserId, organizationId: 'WONKA'}, done)
  })

  lab.afterEach((done) => {
    udaru.clearHook('authorize:isUserAuthorized')
    done()
  })

  lab.test('should support callback based access', (done) => {
    udaru.authorize.isUserAuthorized({userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId}, (err, result) => {
      if (err) return done(err)

      expect(err).to.not.exist()
      expect(result.access).to.be.true()

      done()
    })
  })

  lab.test('should support promise based access and return their results', (done) => {
    udaru.authorize.isUserAuthorized({userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId})
      .then(result => {
        expect(result.access).to.be.true()

        done()
      })
      .catch(done)
  })

  lab.test('should support promise based access and return their errors', (done) => {
    udaru.authorize.isUserAuthorized({userId: testUserId, organizationId})
      .catch(err => {
        expect(err).to.exist()
        expect(err).to.be.an.error('child "action" fails because ["action" is required]')
        done()
      })
  })

  lab.test('should support promise based access and return their errors, executing hooks', (done) => {
    let handlerArgs = {}

    const handler = function (error, input, result, cb) {
      handlerArgs = [error, input, result]
      cb()
    }

    udaru.addHook('authorize:isUserAuthorized', handler)

    udaru.authorize.isUserAuthorized({userId: testUserId, organizationId})
      .catch(err => {
        expect(err).to.exist()
        expect(handlerArgs[0]).to.be.an.error('child "action" fails because ["action" is required]')
        done()
      })
  })

  lab.test('should support promise base access and handle hooks errors', (done) => {
    udaru.addHook('authorize:isUserAuthorized', (...args) => {
      args.pop()(new Error('hook error'))
    })

    udaru.authorize.isUserAuthorized({userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId})
      .catch(err => {
        expect(err).to.be.an.error('hook error')
        done()
      })
  })
})
