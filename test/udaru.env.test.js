'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const exec = require('child_process').exec

lab.experiment('test config env variable', () => {
  lab.test('set env and check config uses it', (done) => {
    const testPass = 'test_pw'
    const options = {
      env: Object.assign({}, process.env, { UDARU_SERVICE_pgdb_password: testPass })
    }
    const jsCode = 'node -e \'const config = require("./lib/core/config"); console.log(config.get("pgdb.password"))\''

    exec(jsCode, options, (error, stdout, stderr) => {
      expect(error).to.not.exist()
      expect(stdout.slice(0, stdout.length - 1)).to.equal(testPass)

      done()
    })
  })
})
