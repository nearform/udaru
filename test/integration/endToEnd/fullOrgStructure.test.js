'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const config = require('../../../lib/plugin/config')
const server = require('../../../lib/server')
const Factory = require('../../factory')
const utils = require('../../utils')

lab.experiment('SuperUsers with limited access across organizations', () => {
  const rootOrgId = config.get('authorization.superUser.organization.id')
  const orgId1 = 'orgId1'
  const orgId2 = 'orgId2'
  const orgId3 = 'orgId3'

  const teamId1 = 'teamId1'
  const teamId2 = 'teamId2'

  const userId1 = 'userId1'
  const userId2 = 'userId2'
  const userId3 = 'userId3'
  const userId4 = 'userId4'

  const records = Factory(lab, {
    organizations: {
      // rootOrg: {
      //   id: rootOrgId,
      //   name: 'root org',
      //   description: 'root org'
      // },
      org1: {
        id: orgId1,
        name: 'org1',
        description: 'org1'
      },
      org2: {
        id: orgId2,
        name: 'org2',
        description: 'org2'
      },
      org3: {
        id: orgId3,
        name: 'org3',
        description: 'org3'
      }
    },
    teams: {
      team1: {
        id: teamId1,
        name: 'team1',
        description: 'team1',
        organizationId: rootOrgId,
        users: ['user1', 'user2'],
        policies: ['org1AdminPolicy', 'org2AdminPolicy']
      },
      team2: {
        id: teamId2,
        name: 'team2',
        description: 'team2',
        organizationId: rootOrgId,
        users: ['user3'],
        policies: ['org3AdminPolicy']
      }
    },
    users: {
      user1: {
        id: userId1,
        name: 'user1',
        organizationId: rootOrgId
      },
      user2: {
        id: userId2,
        name: 'user2',
        organizationId: rootOrgId
      },
      user3: {
        id: userId3,
        name: 'user3',
        organizationId: rootOrgId
      },
      user4: {
        id: userId4,
        name: 'user4',
        organizationId: rootOrgId
      }
    },
    policies: {
      org1AdminPolicy: {
        name: 'org1AdminPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement('action:user:read', 'resource:user')
      },
      org2AdminPolicy: {
        name: 'org2AdminPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement('action:team:read', 'resource:team')
      },
      org3AdminPolicy: {
        name: 'org3AdminPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement('action:team:read', 'resource:team')
      },
      org1InternalPolicy: {
        name: 'org1InternalPolicy',
        organizationId: orgId1,
        statements: utils.AllowStatement('action:organization1:read', 'resource:organization1')
      },
      org2InternalPolicy: {
        name: 'org2InternalPolicy',
        organizationId: orgId2,
        statements: utils.AllowStatement('action:organization2:read', 'resource:organization2')
      },
      org3InternalPolicy: {
        name: 'org3InternalPolicy',
        organizationId: orgId3,
        statements: utils.AllowStatement('action:organization3:read', 'resource:organization3')
      }
    }
  })

  lab.experiment('Check limited super users organization management rights', () => {
    lab.test('List teams and users on an org on which it has rights', (done) => {
      done()
      // const options = utils.requestOptions({
      //   method: 'GET',
      //   url: '/authorization/organizations'
      // })

      // server.inject(options, (response) => {
      //   expect(response.statusCode).to.equal(200)
      //   expect(response.result).to.exist()
      //   expect(response.result.page).to.equal(1)
      //   expect(response.result.total).greaterThan(1)
      //   expect(response.result.limit).greaterThan(1)
      //   done()
      // })
    })

    lab.test('List teams and users on an org on which it has no rights', (done) => {
      done()
    })

    lab.test('Add team and user on an org on which has rights', (done) => {
      done()
    })

    lab.test('Add team and user on an org on which it has no rights', (done) => {
      done()
    })
  })

  lab.experiment('Check limited super users rights on accessing organization resources', () => {
  })
})
