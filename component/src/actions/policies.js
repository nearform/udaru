import { callApi } from '../middleware/api'
import { RECEIVE_POLICIES, RECEIVE_POLICY } from '../constants'

export const fetchPolicy = (id) => {
  return (dispatch, getState) => {
    return callApi('/authorization/policy/' + id).then((policy) => {
      dispatch({ type: RECEIVE_POLICY, policy })

      return policy
    })
  }
}

export const fetchPolicies = () => {
  return (dispatch, getState) => {
    const state = getState()

    if (state.policies.list) {
      return state.policies.list
    }

    return callApi('/authorization/policies').then((policies) => {
      dispatch({ type: RECEIVE_POLICIES, policies })

      return policies
    })
  }
}
