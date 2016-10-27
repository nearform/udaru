import { callApi } from '../middleware/api'
import { RECEIVE_USERS, RECEIVE_USER, DELETE_USER, UPDATE_USER, MAKE_USER } from '../constants'

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

export const fetchUser = (id) => {
  return (dispatch, getState) => {
    return callApi('/authorization/user/' + id).then((user) => {
      dispatch({ type: RECEIVE_USER, user })

      return user
    })
  }
}

export const deleteUser = (id) => {
  return (dispatch, getState) => {
    callApi({
      method: 'delete',
      endpoint: '/authorization/user/' + id
    }).then(res => {
      dispatch({ type: DELETE_USER, id })
    })
  }
}

export const updateUser = (user) => {
  return (dispatch, getState) => {
    callApi({
      method: 'put',
      endpoint: '/authorization/user/' + user.id,
      data: user
    }).then(res => {
      dispatch({ type: UPDATE_USER, user })
    })
  }
}

export const makeUser = (username) => {
  return (dispatch, getState) => {
    callApi({
      method: 'post',
      endpoint: '/authorization/user',
      data: { name: username }
    }).then(user => {
      dispatch({ type: MAKE_USER, user })
    })
  }
}
