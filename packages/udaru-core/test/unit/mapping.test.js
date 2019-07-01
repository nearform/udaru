const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect
const mapping = require('../../lib/mapping.js')

lab.describe('policy', () => {
  lab.test('iam without variables does not fail', done => {
    const res = mapping.policy.iam({ version: 1, name: 'test', statements: { Statement: [{}] } })
    expect(res).to.exist()
    done()
  })

  lab.test('simple without variables does not fail', done => {
    const res = mapping.policy.simple({})
    expect(res).to.exist(res.variables)
    done()
  })

  lab.test('instances without variables does not fail', done => {
    const res = mapping.policy.instances({})
    expect(res).to.exist(res.variables)
    done()
  })
})
