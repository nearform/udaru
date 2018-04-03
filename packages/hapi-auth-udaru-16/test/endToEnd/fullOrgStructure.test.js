'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const config = require('../../config')()
const server = require('../test-server')
const Factory = require('../../../udaru-core/test/factory')
const utils = require('../../../udaru-core/test/testUtils')

const udaru = require('@nearform/udaru-core')()
const Action = config.get('AuthConfig.Action')

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

  Factory(lab, {
    organizations: {
      // ROOT org is created by default in the test DB by the test suite
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
        policies: ['org1AdminPolicy', 'org2AdminPolicy', 'orgAuthPolicy', 'org1InternalPolicy', 'org2InternalPolicy']
      },
      team2: {
        id: teamId2,
        name: 'team2',
        description: 'team2',
        organizationId: rootOrgId,
        users: ['user3'],
        policies: ['org3AdminPolicy', 'orgAuthPolicy', 'org3InternalPolicy']
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
      orgAuthPolicy: {
        name: 'orgAuthPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement([Action.CheckAccess], ['authorization/access'])
      },
      org1InternalPolicy: {
        name: 'org1InternalPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement(['org1:action:read'], ['org1:resource:res1'])
      },
      org2InternalPolicy: {
        name: 'org2InternalPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement(['org2:action:read'], ['org2:resource:res2'])
      },
      org3InternalPolicy: {
        name: 'org3InternalPolicy',
        organizationId: rootOrgId,
        statements: utils.AllowStatement(['org3:action:read'], ['org3::resource:res3'])
      }
    }
  }, udaru)

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

  lab.experiment('Limited SuperUser rights on accessing organization resources', () => {
    lab.test('Access resource on which it has rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId1
        },
        method: 'GET',
        url: `/authorization/access/${userId1}/org1:action:read/org1:resource:res1`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200)
        expect(response.result.access).to.equal(true)

        done()
      })
    })

    lab.test('Do an invalid action on a resource on which it has rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId1
        },
        method: 'GET',
        url: `/authorization/access/${userId1}/org1:action:dummy/org1:resource:res1`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200)
        expect(response.result.access).to.equal(false)

        done()
      })
    })

    lab.test('Access resource on which it has no rights', (done) => {
      const options = {
        headers: {
          authorization: userId1,
          org: orgId3
        },
        method: 'GET',
        url: `/authorization/access/${userId1}/org3:action:read/org3:resource:res3`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(200)
        expect(response.result.access).to.equal(false)

        done()
      })
    })

    lab.test('Access resource by user not registered in teams on which it has no rights', (done) => {
      const options = {
        headers: {
          authorization: userId4,
          org: orgId1
        },
        method: 'GET',
        url: `/authorization/access/${userId4}/org1:action:read/org1:resource:res1`
      }

      server.inject(options, (response) => {
        expect(response.statusCode).to.equal(403)

        done()
      })
    })
  })
})
