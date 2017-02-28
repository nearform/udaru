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

  lab.test('set resources in env and check Udaru uses it', (done) => {
    const testTemplate = '/{{ namespace }}/organization1/[organizationId]'
    const options = {
      env: Object.assign({}, process.env, { UDARU_RESOURCES_templates_organizations: testTemplate })
    }
    const jsCode = 'node -e \'const config = require("./lib/core/config/config.auth.js"); console.log(config.resources.organizations({organizationId: 1}))\''

    exec(jsCode, options, (error, stdout, stderr) => {
      expect(error).to.not.exist()
      expect(stdout.slice(0, stdout.length - 1)).to.equal('/authorization/organization1/1')

      done()
    })
  })
})
