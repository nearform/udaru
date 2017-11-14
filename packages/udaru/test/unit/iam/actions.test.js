'use strict'

const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect

const Iam = require('../../../lib/ops/iam')

lab.describe('actions function', () => {
  let policies = [
    {
      Version: '2106-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'foo:bar:clone',
            'foo:bar:delete',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'],
          Resource: ['resources/thing1/*']
        },
        {
          Effect: 'Allow',
          Action: [
            'foo:bar:clone',
            'foo:bar:list',
            'foo:bar:read'],
          Resource: ['resources/duplicatething']
        },
        {
          Effect: 'Allow',
          Action: [
            'foo:bar:clone',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:delete'],
          Resource: ['resources/duplicatething']
        },
        {
          Effect: 'Allow',
          Action: [
            'foo:bar:clone',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'],
          Resource: ['resources/thing2/*']
        },
        {
          Effect: 'Deny',
          Action: ['foo:bar:*'],
          Resource: ['resources/nothing/*']
        },
        {
          Effect: 'Allow',
          Action: [
            'foo:bar:publish',
            'foo:bar:read'
          ],
          Resource: ['resources/thing3']
        },
        {
          Effect: 'Deny',
          Action: ['foo:bar:publish'],
          Resource: ['resources/thing3']
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

  lab.test('should list actions for a list of mutiple resources', done => {
    iam.actionsOnResources({ resources: ['resources/thing1/something', 'resources/thing2/something'] }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        {
          resource: 'resources/thing1/something',
          actions: [
            'foo:bar:clone',
            'foo:bar:delete',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'
          ]
        },
        {
          resource: 'resources/thing2/something',
          actions: [
            'foo:bar:clone',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'
          ]
        }
      ])

      done()
    })
  })

  lab.test('should list actions for multiple resources including resources defined in multiple policies', done => {
    iam.actionsOnResources({ resources: ['resources/thing1/something', 'resources/multi/something'] }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        {
          resource: 'resources/thing1/something',
          actions: [
            'foo:bar:clone',
            'foo:bar:delete',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:publish'
          ]
        },
        {
          resource: 'resources/multi/something',
          actions: [
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
          ]
        }
      ])

      done()
    })
  })

  lab.test('should not return duplicate actions on resources that are defined in multiple policies', done => {
    iam.actionsOnResources({ resources: ['resources/duplicatething', 'resources/multi/something'] }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        {
          resource: 'resources/duplicatething',
          actions: [
            'foo:bar:clone',
            'foo:bar:list',
            'foo:bar:read',
            'foo:bar:delete'
          ]
        },
        {
          resource: 'resources/multi/something',
          actions: [
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
          ]
        }
      ])
    })
    done()
  })

  lab.test('Should maintain that Deny statements take precedence over Allow ', done => {
    iam.actionsOnResources({ resources: ['resources/thing3'] }, (err, result) => {
      expect(err).to.not.exist()
      expect(result).to.equal([
        {
          resource: 'resources/thing3',
          actions: [
            'foo:bar:read'
          ]
        }
      ])
    })
    done()
  })
})
