'use strict'

const _ = require('lodash')
const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const udaru = require('../..')()

const organizationId = 'WONKA'

lab.experiment('Hooks', () => {
  let testUserId

  lab.before(done => {
    udaru.policies.list({organizationId}, (err, policies) => {
      if (err) return done(err)

      udaru.users.create({name: 'Salman', organizationId}, (err, result) => {
        if (err) return done(err)

        testUserId = result.id
        udaru.users.replacePolicies({ id: testUserId, policies: [{id: _.find(policies, {name: 'Director'}).id}], organizationId }, done)
      })
    })
  })

  lab.after(done => {
    udaru.users.delete({id: testUserId, organizationId: 'WONKA'}, done)
  })

  lab.afterEach(done => {
    udaru.hooks.clear('users:list')
    done()
  })

  lab.experiment('validation', () => {
    lab.test('requires hook name to be a string', done => {
      expect(() => {
        udaru.hooks.add([], (...args) => args.pop()())
      }).to.throw(TypeError, 'The hook name must be a string')

      done()
    })

    lab.test('requires hook name to be valid', done => {
      expect(() => {
        udaru.hooks.add('invalid', (...args) => args.pop()())
      }).to.throw(Error, 'invalid hook not supported')

      done()
    })

    lab.test('requires hook handler to be a function', done => {
      expect(() => {
        udaru.hooks.add('authorize:isUserAuthorized', {})
      }).to.throw(TypeError, 'The hook callback must be a function')

      done()
    })
  })

  lab.experiment('on callback style udaru methods', () => {
    lab.experiment('using callback style hooks', () => {
      lab.test('should execute hooks and propagate the success', done => {
        let handlerArgs = {}
        let otherHandlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb()
        }

        const otherHandler = function (error, input, result, cb) {
          otherHandlerArgs = [error, input, result]
          cb()
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.not.exist()
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(handlerArgs[0]).to.equal(err)
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          expect(otherHandlerArgs[0]).to.equal(err)
          expect(otherHandlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(otherHandlerArgs[2][0]).to.equal(data)
          expect(otherHandlerArgs[2][1]).to.equal(total)

          done()
        })
      })

      lab.test('should execute hooks and get udaru errors', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb()
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({invalid: 'WONKA'}, (err, data, total) => {
          expect(err).to.be.a.error()
          expect(data).to.not.exist()
          expect(total).to.not.exist()

          expect(handlerArgs[0]).to.be.a.error()
          expect(handlerArgs[1]).to.equal([{invalid: 'WONKA'}])
          expect(handlerArgs[2]).to.equal([])

          done()
        })
      })

      lab.test('should execute all hooks and ignore hooks errors by default', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          setImmediate(() => {
            handlerArgs = [error, input, result]
            cb(new Error('ERROR'))
          })
        }

        const otherHandler = function (_u1, _u2, _u3, cb) {
          otherHandler.called = true
          cb()
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.not.exist()
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(otherHandler.called).to.equal(true)
          expect(handlerArgs[0]).to.not.exist()
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          done()
        })
      })

      lab.test('should execute all hooks and propagate the first hooks error if asked to', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          setImmediate(() => {
            handlerArgs = [error, input, result]
            cb(new Error('ERROR'))
          })
        }

        const otherHandler = function (_u1, _u2, _u3, cb) {
          otherHandler.called = true
          cb()
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)
        udaru.fullConfig.get('hooks').propagateErrors = true

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.be.error(Error, 'ERROR')
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(otherHandler.called).to.equal(true)
          expect(handlerArgs[0]).to.not.exist()
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          udaru.fullConfig.get('hooks').propagateErrors = false
          done()
        })
      })
    })

    lab.experiment('using promise style hooks', () => {
      lab.test('should execute hooks and propagate the success', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          return new Promise(resolve => {
            handlerArgs = [error, input, result]
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.not.exist()
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(handlerArgs[0]).to.equal(err)
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          done()
        })
      })

      lab.test('should execute hooks and get udaru errors', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          return new Promise(resolve => {
            handlerArgs = [error, input, result]
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({invalid: 'WONKA'}, (err, data, total) => {
          expect(err).to.be.a.error()
          expect(data).to.not.exist()
          expect(total).to.not.exist()

          expect(handlerArgs[0]).to.be.a.error()
          expect(handlerArgs[1]).to.equal([{invalid: 'WONKA'}])
          expect(handlerArgs[2]).to.equal([])

          done()
        })
      })

      lab.test('should execute all hooks and ignore hooks rejections by default', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          handlerArgs = [error, input, result]
          return Promise.reject(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3) {
          return new Promise(resolve => {
            otherHandler.called = true
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.not.exists()
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(otherHandler.called).to.equal(true)
          expect(handlerArgs[0]).to.not.exist()
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          done()
        })
      })

      lab.test('should execute all hooks and reject the first hooks rejection if asked to', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          handlerArgs = [error, input, result]
          return Promise.reject(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3) {
          return new Promise(resolve => {
            otherHandler.called = true
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)
        udaru.fullConfig.get('hooks').propagateErrors = true

        udaru.users.list({organizationId: 'WONKA'}, (err, data, total) => {
          expect(err).to.be.error(Error, 'ERROR')
          expect(data).to.exist()
          expect(total).to.greaterThan(1)

          expect(otherHandler.called).to.equal(true)
          expect(handlerArgs[0]).to.not.exist()
          expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
          expect(handlerArgs[2][0]).to.equal(data)
          expect(handlerArgs[2][1]).to.equal(total)

          udaru.fullConfig.get('hooks').propagateErrors = false
          done()
        })
      })
    })
  })

  lab.experiment('on promise style udaru methods', () => {
    lab.experiment('using callback style hooks', () => {
      lab.test('should execute hooks and resolve with the success', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb()
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({organizationId: 'WONKA'})
          .then(args => {
            expect(args.data).to.exist()
            expect(args.total).to.greaterThan(1)

            expect(handlerArgs[0]).to.equal(null)
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.equal(args.data)
            expect(handlerArgs[2].total).to.equal(args.total)

            done()
          })
          .catch(done)
      })

      lab.test('should execute hooks with the rejected udaru errors, then reject', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb()
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({invalid: 'WONKA'})
          .catch(err => {
            expect(err).to.be.a.error()

            expect(handlerArgs[0]).to.equal(err)
            expect(handlerArgs[1]).to.equal([{invalid: 'WONKA'}])
            expect(handlerArgs[2]).to.equal(null)

            done()
          })
          .catch(done)
      })

      lab.test('should execute all hooks and ignore hooks error by default', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3, cb) {
          otherHandler.called = true
          cb()
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)

        udaru.users.list({organizationId: 'WONKA'})
          .then(args => {
            expect(args.data).to.exist()
            expect(args.total).to.greaterThan(1)

            expect(otherHandler.called).to.equal(true)
            expect(handlerArgs[0]).to.equal(null)
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.equal(args.data)
            expect(handlerArgs[2].total).to.equal(args.total)

            done()
          })
          .catch(done)
      })

      lab.test('should execute all hooks and reject with the first hooks error if asked to', done => {
        let handlerArgs = {}

        const handler = function (error, input, result, cb) {
          handlerArgs = [error, input, result]
          cb(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3, cb) {
          otherHandler.called = true
          cb()
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)
        udaru.fullConfig.get('hooks').propagateErrors = true

        udaru.users.list({organizationId: 'WONKA'})
          .catch(err => {
            expect(err).to.be.a.error()

            expect(otherHandler.called).to.equal(true)
            expect(handlerArgs[0]).to.not.exist()
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.exist()
            expect(handlerArgs[2].total).to.greaterThan(1)

            udaru.fullConfig.get('hooks').propagateErrors = false
            done()
          })
          .catch(done)
      })
    })

    lab.experiment('using promise style hooks', () => {
      lab.test('should execute hooks and resolve with the success', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          return new Promise(resolve => {
            handlerArgs = [error, input, result]
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({organizationId: 'WONKA'})
          .then(args => {
            expect(args.data).to.exist()
            expect(args.total).to.greaterThan(1)

            expect(handlerArgs[0]).to.equal(null)
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.equal(args.data)
            expect(handlerArgs[2].total).to.equal(args.total)

            done()
          })
          .catch(done)
      })

      lab.test('should execute hooks and get udaru errors', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          return new Promise(resolve => {
            handlerArgs = [error, input, result]
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)

        udaru.users.list({invalid: 'WONKA'})
          .catch(err => {
            expect(err).to.be.a.error()

            expect(handlerArgs[0]).to.equal(err)
            expect(handlerArgs[1]).to.equal([{invalid: 'WONKA'}])
            expect(handlerArgs[2]).to.be.null()

            done()
          })
          .catch(done)
      })

      lab.test('should execute all hooks and ignore hooks error by default', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          handlerArgs = [error, input, result]
          return Promise.reject(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3) {
          return new Promise(resolve => {
            otherHandler.called = true
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)

        udaru.users.list({organizationId: 'WONKA'})
          .then(args => {
            expect(args.data).to.exist()
            expect(args.total).to.greaterThan(1)

            expect(otherHandler.called).to.equal(true)
            expect(handlerArgs[0]).to.equal(null)
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.equal(args.data)
            expect(handlerArgs[2].total).to.equal(args.total)

            done()
          })
          .catch(done)
      })

      lab.test('should execute all hooks and reject the first hooks error if asked to', done => {
        let handlerArgs = {}

        const handler = function (error, input, result) {
          handlerArgs = [error, input, result]
          return Promise.reject(new Error('ERROR'))
        }

        const otherHandler = function (_u1, _u2, _u3) {
          return new Promise(resolve => {
            otherHandler.called = true
            resolve()
          })
        }

        udaru.hooks.add('users:list', handler)
        udaru.hooks.add('users:list', otherHandler)
        udaru.fullConfig.get('hooks').propagateErrors = true

        udaru.users.list({organizationId: 'WONKA'})
          .catch(err => {
            expect(err).to.be.error(Error, 'ERROR')

            expect(otherHandler.called).to.equal(true)
            expect(handlerArgs[0]).to.not.exist()
            expect(handlerArgs[1]).to.equal([{organizationId: 'WONKA'}])
            expect(handlerArgs[2].data).to.exist()
            expect(handlerArgs[2].total).to.greaterThan(1)

            udaru.fullConfig.get('hooks').propagateErrors = false
            done()
          })
          .catch(done)
      })
    })
  })
})
