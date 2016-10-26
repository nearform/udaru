import { RECEIVE_TEAMS, RECEIVE_TEAM, DELETE_TEAM, UPDATE_TEAM, MAKE_TEAM } from '../constants'

import sortByName from '../lib/sortByName'

const initialState = {
  list: null
}

const teams = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_TEAMS:
      return Object.assign({}, state, {
        list: action.teams
      })
    case RECEIVE_TEAM:
      return Object.assign({}, state, {
        selectedTeam: action.team
      })
    case DELETE_TEAM:
      const filtered = state.list.filter(item => {
        if (item.id !== action.id) return item
      })
      return Object.assign({}, state, {
        list: filtered,
        selectedTeam: null
      })
    case UPDATE_TEAM:
      const list = state.list.map(item => {
        if (item.id === action.team.id) return action.team
        return item
      })
      return Object.assign({}, state, {
        list,
        selectedTeam: action.team
      })
    case MAKE_TEAM:
      return Object.assign({}, state, {
        list: state.list.concat([action.team]).sort(sortByName),
        selectedTeam: action.team
      })
    default:
      return state
  }
}

export default teams
