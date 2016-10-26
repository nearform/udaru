import { callApi } from '../middleware/api'
import { RECEIVE_TEAMS, RECEIVE_TEAM, DELETE_TEAM, UPDATE_TEAM, MAKE_TEAM } from '../constants'

export const fetchTeams = () => {
  return (dispatch, getState) => {
    const state = getState()

    if (state.teams.list) {
      return state.teams.list
    }

    return callApi('/authorization/teams').then((teams) => {
      dispatch({ type: RECEIVE_TEAMS, teams })

      return teams
    })
  }
}

export const fetchTeam = (id) => {
  return (dispatch, getState) => {
    return callApi('/authorization/team/' + id).then((team) => {
      dispatch({ type: RECEIVE_TEAM, team })

      return team
    })
  }
}

export const deleteTeam = (id) => {
  return (dispatch, getState) => {
    callApi({
      method: 'delete',
      endpoint: '/authorization/team/' + id
    }).then(res => {
      dispatch({ type: DELETE_TEAM, id })
    })
  }
}

export const updateTeam = (team) => {
  return (dispatch, getState) => {
    callApi({
      method: 'put',
      endpoint: '/authorization/team/' + team.id,
      data: team
    }).then(res => {
      dispatch({ type: UPDATE_TEAM, team })
    })
  }
}

export const makeTeam = (teamname) => {
  return (dispatch, getState) => {
    callApi({
      method: 'post',
      endpoint: '/authorization/team',
      data: { name: teamname }
    }).then(team => {
      dispatch({ type: MAKE_TEAM, team })
    })
  }
}
