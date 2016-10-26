import { RECEIVE_POLICIES, RECEIVE_POLICY } from '../constants'

const initialState = {
  list: null
}

const policies = (state = initialState, action) => {
  switch (action.type) {
    case RECEIVE_POLICIES:
      return Object.assign({}, state, {
        list: action.policies
      })
    case RECEIVE_POLICY:
      return Object.assign({}, state, {
        selectedPolicy: action.policy
      })
    default:
      return state
  }
}

export default policies
