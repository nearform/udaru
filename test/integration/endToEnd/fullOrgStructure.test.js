'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const config = require('../../../lib/plugin/config')
const server = require('../../../lib/server')
const Factory = require('../../factory')
const utils = require('../../utils')
const Action = config.get('AuthConfig.Action')
const resources = config.get('AuthConfig.resources')

lab.experiment('SuperUsers with limited access across organizations', () => {
  const defaultAdminPolicy = 'authorization.organizations.defaultPolicies.orgAdmin'
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
        statements: config.get(defaultAdminPolicy, {organizationId: orgId1}).statements
      },
      org2AdminPolicy: {
        name: 'org2AdminPolicy',
        organizationId: rootOrgId,
        statements: config.get(defaultAdminPolicy, {organizationId: orgId2}).statements
      },
      org3AdminPolicy: {
        name: 'org3AdminPolicy',
        organizationId: rootOrgId,
        statements: config.get(defaultAdminPolicy, {organizationId: orgId3}).statements
      },
      org1InternalPolicy: {
        name: 'org1InternalPolicy',
        organizationId: orgId1,
        statements: utils.AllowStatement([], [])
      },
      org2InternalPolicy: {
        name: 'org2InternalPolicy',
        organizationId: orgId2,
        statements: utils.AllowStatement([], [])
      },
      org3InternalPolicy: {
        name: 'org3InternalPolicy',
        organizationId: orgId3,
        statements: utils.AllowStatement([], [])
      }
    }
  })

  lab.experiment('Check limited super users organization management rights', () => {
    lab.test('Get org on an org endpoint on which it has rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId1
        },
        method: 'GET',
        url: `/authorization/organizations/${orgId1}`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.exist()
        expect(response.result.id).to.equal(orgId1)

        done()
      })
    })

    lab.test('Get org on an org endpoint on which it has no rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId3
        },
        method: 'GET',
        url: `/authorization/organizations/${orgId3}`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        done()
      })
    })

    lab.test('SuperUser not in team has no rights', (done) => {
      const options = {
        headers: {
          authorization: userId4,
          org: orgId1
        },
        method: 'GET',
        url: `/authorization/organizations/${orgId1}`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        done()
      })
    })

    lab.test('List teams and users on an org on which it has rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId1
        },
        method: 'GET',
        url: '/authorization/teams'
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200)
        expect(response.result).to.exist()
        expect(response.result.data).to.exist()

        done()
      })
    })

    lab.test('List teams and users on an org on which it has no rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId3
        },
        method: 'GET',
        url: '/authorization/teams'
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        options.headers.authorization = userId4
        server.inject(options, (response) => {
          expect(response.statusCode).to.equal(403)

          done()
        })
      })
    })
  })

  lab.experiment('Check limited super users rights on accessing organization resources', () => {
  })
})
