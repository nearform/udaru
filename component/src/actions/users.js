import { callApi } from '../middleware/api'
import { RECEIVE_USERS, RECEIVE_USER, DELETE_USER } from '../constants'

export const fetchUser = (id) => {
  return (dispatch, getState) => {
    const state = getState()

    return callApi('/authorization/user/' + id).then((user) => {
      dispatch({ type: RECEIVE_USER, user })

      return user
    })
  }
}

export const fetchUsers = () => {
  return (dispatch, getState) => {
    const state = getState()

    if (state.users.list) {
      return state.users.list
    }

    return callApi('/authorization/users').then((users) => {
      dispatch({ type: RECEIVE_USERS, users })

      return users
    })
  }
}

export const deleteUser = (id) => {
  return (dispatch, getState) => {
    const state = getState()

    dispatch({ type: DELETE_USER, id})
    // return callApi('/authorization/user/' + id).then((user) => {
    //   dispatch({ type: RECEIVE_USER, user })
    //
    //   return user
    // })
  }
}
