const initialState = {
  list: null
}

const policies = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_POLICIES':
      return state
    default:
      return state
  }
}

export default policies
