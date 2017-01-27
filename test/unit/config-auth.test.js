'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const configAuth = require('../../lib/module/lib/config/config.auth')

lab.experiment('config.auth.js', () => {
  const orgData = { organizationId: 'MyOrg' }
  const TeamData = { organizationId: 'MyOrg', teamId: 'teamId' }
  const UserData = { organizationId: 'MyOrg', teamId: 'teamId', userId: 'userId' }
  const RandomData = { organizationId: 'MyOrg', teamId: 'teamId', userId: 'userId', random: 'random', data: 'data' }
  const policyData = { organizationId: 'MyOrg', policyId: 'policyId' }

  lab.test('Resources - organization', (done) => {
    expect(configAuth.resources.organizations({})).to.equal('/authorization/organization/*')
    expect(configAuth.resources.organizations(orgData)).to.equal('/authorization/organization/MyOrg')
    expect(configAuth.resources.organizations(TeamData)).to.equal('/authorization/organization/MyOrg')
    expect(configAuth.resources.organizations(UserData)).to.equal('/authorization/organization/MyOrg')
    expect(configAuth.resources.organizations(RandomData)).to.equal('/authorization/organization/MyOrg')

    done()
  })

  lab.test('Resources - teams', (done) => {
    expect(configAuth.resources.teams({})).to.equal('/authorization/team/*/*')
    expect(configAuth.resources.teams(orgData)).to.equal('/authorization/team/MyOrg/*')
    expect(configAuth.resources.teams(TeamData)).to.equal('/authorization/team/MyOrg/teamId')
    expect(configAuth.resources.teams(UserData)).to.equal('/authorization/team/MyOrg/teamId')
    expect(configAuth.resources.teams(RandomData)).to.equal('/authorization/team/MyOrg/teamId')

    done()
  })

  lab.test('Resources - users', (done) => {
    expect(configAuth.resources.users({})).to.equal('/authorization/user/*/*/*')
    expect(configAuth.resources.users(orgData)).to.equal('/authorization/user/MyOrg/*/*')
    expect(configAuth.resources.users(TeamData)).to.equal('/authorization/user/MyOrg/teamId/*')
    expect(configAuth.resources.users(UserData)).to.equal('/authorization/user/MyOrg/teamId/userId')
    expect(configAuth.resources.users(RandomData)).to.equal('/authorization/user/MyOrg/teamId/userId')

    done()
  })

  lab.test('Resources - policies', (done) => {
    expect(configAuth.resources.policies({})).to.equal('/authorization/policy/*/*')
    expect(configAuth.resources.policies(orgData)).to.equal('/authorization/policy/MyOrg/*')
    expect(configAuth.resources.policies(policyData)).to.equal('/authorization/policy/MyOrg/policyId')
    expect(configAuth.resources.policies(TeamData)).to.equal('/authorization/policy/MyOrg/*')
    expect(configAuth.resources.policies(UserData)).to.equal('/authorization/policy/MyOrg/*')
    expect(configAuth.resources.policies(RandomData)).to.equal('/authorization/policy/MyOrg/*')

    done()
  })
})
