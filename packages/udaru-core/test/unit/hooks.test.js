'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const udaru = require('../..')()

const organizationId = 'WONKA'

lab.experiment('Hooks', () => {
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

  lab.test('requires hook name to be a string', (done) => {
    expect(() => {
      udaru.addHook([], (...args) => args.pop()())
    }).to.throw(TypeError, 'The hook name must be a string')

    done()
  })

  lab.test('requires hook name to be valid', (done) => {
    expect(() => {
      udaru.addHook('invalid', (...args) => args.pop()())
    }).to.throw(Error, 'invalid hook not supported')

    done()
  })

  lab.test('requires hook handler to be a function', (done) => {
    expect(() => {
      udaru.addHook('authorize:isUserAuthorized', {})
    }).to.throw(TypeError, 'The hook callback must be a function')

    done()
  })

  lab.test('should execute a hook with both input and output handler', (done) => {
    let handlerArgs = {}

    const handler = function (error, input, result, cb) {
      handlerArgs = [error, input, result]
      cb()
    }

    udaru.addHook('authorize:isUserAuthorized', handler)

    udaru.authorize.isUserAuthorized({userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId}, (err, result) => {
      if (err) return done(err)

      expect(err).to.not.exist()
      expect(result).to.exist()
      expect(result.access).to.be.true()
      expect(handlerArgs).to.equal([
        null,
        [{userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId}],
        [{access: true}]
      ])

      done()
    })
  })

  lab.test('should execute a hook even if the original method threw an error', (done) => {
    let handlerArgs = {}

    const handler = function (error, input, result, cb) {
      handlerArgs = [error, input, result]
      cb()
    }

    udaru.addHook('authorize:isUserAuthorized', handler)

    udaru.authorize.isUserAuthorized({userId: testUserId, organizationId}, (err, result) => {
      expect(err).to.exist()
      expect(handlerArgs[0]).to.be.an.error('child "action" fails because ["action" is required]')

      done()
    })
  })

  lab.test('should execute all hooks and handle their errors', (done) => {
    let handlerArgs
    const handler = function (error, input, result, cb) {
      handlerArgs = [error, input, result]
      cb()
    }

    udaru.addHook('authorize:isUserAuthorized', handler)

    udaru.addHook('authorize:isUserAuthorized', (...args) => {
      args.pop()(new Error('hook error'))
    })

    udaru.authorize.isUserAuthorized({userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId}, (err, result) => {
      expect(err).to.be.an.error('hook error')

      expect(handlerArgs).to.equal([
        null,
        [{userId: testUserId, resource: 'database:pg01:balancesheet', action: 'finance:ReadBalanceSheet', organizationId}],
        [{access: true}]
      ])

      done()
    })
  })
})
