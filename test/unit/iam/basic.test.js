const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect

const Iam = require('../../../lib/core/lib/ops/iam')

lab.describe('Basic access tests', () => {
  let policies = [{
    Version: '2106-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['foo:bar:clone',
        'foo:bar:delete',
        'foo:bar:list',
        'foo:bar:read',
        'foo:bar:publish'],
      Resource: ['resources/thing1/*']
    }]
  }]
  let iam = Iam(policies)

  lab.test('should allow', done => {
    let access = iam.isAuthorized({ resource: 'resources/thing1/something', action: 'foo:bar:list' })
    expect(access).to.be.true()
    done()
  })

  lab.test('should not allow', done => {
    let access = iam.isAuthorized({ resource: 'resources/thing2', action: 'foo:bar:list' })
    expect(access).to.be.false()
    done()
  })
})
