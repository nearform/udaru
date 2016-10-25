import { RECEIVE_USERS, RECEIVE_USER, DELETE_USER, UPDATE_USER, MAKE_USER } from '../constants'

const initialState = {
  list: null
}

const users = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_USERS:
      return Object.assign({}, state, {
        list: action.users
      })
    case RECEIVE_USER:
      return Object.assign({}, state, {
        selectedUser: action.user
      })
    case DELETE_USER:
      const filtered = state.list.filter(item => {
        if (item.id !== action.id) return item
      })
      return Object.assign({}, state, {
        list: filtered,
        selectedUser: null
      })
    case UPDATE_USER:
      const list = state.list.map(item => {
        if (item.id === action.user.id) return action.user
        return item
      })
      return Object.assign({}, state, {
        list,
        selectedUser: action.user
      })
    case MAKE_USER:
      return Object.assign({}, state, {
        list: state.list.concat([action.user]),
        selectedUser: action.user
      })
    default:
      return state
  }
}

export default users
