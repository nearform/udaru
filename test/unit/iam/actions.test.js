'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect

const Iam = require('../../../lib/core/lib/ops/iam')

lab.describe('actions function', () => {
  let policies = [
    {
      Version: '2106-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['foo:bar:clone',
            'foo:bar:delete',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'],
          Resource: ['resources/thing1/*']
        },
        {
          Effect: 'Deny',
          Action: ['foo:bar:*'],
          Resource: ['resources/nothing/*']
        }
      ]
    },
    {
      Version: '2106-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['foo:bar:read'],
          Resource: ['resources/nothing/no-read']
        },
        {
          Effect: 'Allow',
          Action: ['foo:baz:clone',
            'foo:baz:delete',
            'foo:baz:list',
            'foo:baz:read',
            'foo:baz:publish'],
          Resource: ['resources/multi/*']
        }
      ]
    },
    {
      Version: '2106-10-17',
      Statement: [{
        Effect: 'Allow',
        Action: ['foo:bar:clone',
          'foo:bar:delete',
          'foo:bar:list',
          'foo:bar:read',
          'foo:bar:publish'],
        Resource: ['resources/multi/*']
      }]
    }
  ]
  let iam = Iam(policies)

  lab.test('should list actions', done => {
    iam.actions({ resource: 'resources/thing1/something' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        'foo:bar:clone',
        'foo:bar:delete',
        'foo:bar:list',
        'foo:bar:read',
        'foo:bar:publish'
      ])

      done()
    })
  })

  lab.test('should list actions that could be ok for mutiple resources', done => {
    iam.actions({ resource: 'resources/multi/something' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        'foo:baz:clone',
        'foo:baz:delete',
        'foo:baz:list',
        'foo:baz:read',
        'foo:baz:publish',
        'foo:bar:clone',
        'foo:bar:delete',
        'foo:bar:list',
        'foo:bar:read',
        'foo:bar:publish'
      ])

      done()
    })
  })

  lab.test('should not list denied actions', done => {
    iam.actions({ resource: 'resources/nothing/no-read' }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([])

      done()
    })
  })
})
