/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

const mu = require('mu')()
const log = require('pino')()
const tcp = require('mu/drivers/tcp')

const service = require('./lib/service')

/**
 * options:
 *
 *  port
 *  host
 *  logLevel
 */
module.exports = function (opts) {
  log.level = opts && opts.logLevel || 'info'

  function start (cb) {
    service(opts, function (svc) {
      mu.define({role: 'authorization', cmd: 'list', type: 'users'}, function (args, cb) {
        svc.listAllUsers(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'create', type: 'user'}, function (args, cb) {
        svc.createUser(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'read', type: 'user'}, function (args, cb) {
        svc.readUserById(args.pattern.params, function (err, result) {
          log.debug(err, 'Wiring error:')
          log.debug('Wiring result: %j', result)

          // temporarily using err.message instead of err, due to mu bug
          if (err) return cb(err.message, null)
          return cb(null, result)
        })
      })
      mu.define({role: 'authorization', cmd: 'update', type: 'user'}, function (args, cb) {
        svc.updateUser(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'delete', type: 'user'}, function (args, cb) {
        svc.deleteUserById(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'list', type: 'policies'}, function (args, cb) {
        svc.listAllPolicies(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'read', type: 'policy'}, function (args, cb) {
        svc.readPolicyById(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'list', type: 'teams'}, function (args, cb) {
        svc.listAllTeams(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'create', type: 'team'}, function (args, cb) {
        svc.createTeam(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'read', type: 'team'}, function (args, cb) {
        svc.readTeamById(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'update', type: 'team'}, function (args, cb) {
        svc.updateTeam(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'delete', type: 'team'}, function (args, cb) {
        svc.deleteTeamById(args.pattern.params, cb)
      })
      mu.define({role: 'authorization', cmd: 'authorize', type: 'user'}, function (args, cb) {
        svc.isUserAuthorized(args.pattern.params, (err, result) => {
          if (err) return cb(err, null)
          return cb(null, result)
        })
      })

      mu.define({role: 'authorization', cmd: 'done'}, svc.destroy)

      mu.inbound('*', tcp.server(opts))
      cb()
    })
  }

  function stop () {
    mu.tearDown()
  }

  return {
    start: start,
    stop: stop
  }
}
