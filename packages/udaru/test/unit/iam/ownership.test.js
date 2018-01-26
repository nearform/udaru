const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect

const Iam = require('../../../lib/ops/iam')

lab.describe('Ownership', () => {
  var policies = [{
    Version: '2106-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: ['foo:bar:clone',
        'foo:bar:delete',
        'foo:bar:list',
        'foo:bar:read',
        'foo:bar:publish'],
      /* eslint-disable no-template-curly-in-string */
      Resource: ['resources/${req:UserName}/*']
    }]
  }]
  let iam = Iam(policies)

  lab.test('should allow', done => {
    let access = iam.isAuthorized({ resource: 'resources/bob/something', action: 'foo:bar:list', variables: { req: { UserName: 'bob' } } })
    expect(access).to.be.true()
    done()
  })

  lab.test('should not allow', done => {
    let access = iam.isAuthorized({ resource: 'resources/fred/anotherthing', action: 'foo:bar:list' })
    expect(access).to.be.false()
    done()
  })
})
