import Lab from 'lab'
import Code from 'code'

import reducer from '../../src/reducers/teams'
import { RECEIVE_TEAMS, RECEIVE_TEAM, DELETE_TEAM, UPDATE_TEAM, MAKE_TEAM } from '../../src/constants'

const lab = exports.lab = Lab.script()

lab.experiment('teams', () => {
  const initialState = {
    list: null
  }

  const mockedTeams = [{
    id: 1,
    name: 'AtEaM'
  }, {
    id: 2,
    name: 'AnOtHeR'
  }]

  const mockedTeam = {
    id: 1,
    name: 'AtEaM',
    policies: [{
      id: 1,
      name: 'ApOlIcY'
    }],
    users: [{
      id: 1,
      name: 'AuSeR'
    }]
  }

  const stateWithSelected = {
    list: mockedTeams,
    selectedTeam: mockedTeam
  }

  const updatedTeam = {
    id: 1,
    name: 'AnUpDaTeDtEaM',
    policies: [{
      id: 2,
      name: 'AnOtHeRpOlIcY'
    }],
    users: [{
      id: 2,
      name: 'AnOtHeRuSeR'
    }]
  }

  const newTeam = {
    id: 3,
    name: 'AnEwTeAm',
    policies: [],
    users: []
  }

  lab.test('should return initial state', (done) => {
    Code.expect(
      reducer(undefined, {})
    ).to.equal(
      initialState
    )

    done()
  })

  lab.test('should handle RECEIVE_TEAMS', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_TEAMS,
        teams: mockedTeams
      })
    ).to.equal({
      list: mockedTeams
    })

    done()
  })

  lab.test('should handle RECEIVE_TEAM', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_TEAM,
        team: mockedTeam
      })
    ).to.equal({
      list: null,
      selectedTeam: mockedTeam
    })

    done()
  })

  lab.test('should handle DELETE_TEAM', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: DELETE_TEAM,
        id: mockedTeam.id
      })
    ).to.equal({
      list: [mockedTeams[1]],
      selectedTeam: null
    })

    done()
  })

  lab.test('should handle UPDATE_TEAM', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: UPDATE_TEAM,
        team: updatedTeam
      })
    ).to.equal({
      list: [updatedTeam, stateWithSelected.list[1]],
      selectedTeam: updatedTeam
    })

    done()
  })

  lab.test('should handle MAKE_TEAM', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: MAKE_TEAM,
        team: newTeam
      })
    ).to.equal({
      list: [newTeam, mockedTeams[1], mockedTeams[0]],
      selectedTeam: newTeam
    })

    done()
  })

})
