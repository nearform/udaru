const initialState = {
  list: null
}

const users = (state = initialState, action) => {
  switch (action.type) {
    case 'GET_USERS':
      return state
    default:
      return state
  }
}

export default users
