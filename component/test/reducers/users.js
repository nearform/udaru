import Lab from 'lab'
import Code from 'code'

import reducer from '../../src/reducers/users'
import { RECEIVE_USERS, RECEIVE_USER, DELETE_USER, UPDATE_USER, MAKE_USER } from '../../src/constants'

const lab = exports.lab = Lab.script()

lab.experiment('users', () => {
  const initialState = {
    list: null
  }

  const mockedUsers = [{
    id: 1,
    name: 'AuSeR'
  }, {
    id: 2,
    name: 'AnOtHeR'
  }]

  const mockedUser = {
    id: 1,
    name: 'AuSeR',
    policies: [{
      id: 1,
      name: 'ApOlIcY'
    }],
    teams: [{
      id: 1,
      name: 'AtEaM'
    }]
  }

  const stateWithSelected = {
    list: mockedUsers,
    selectedUser: mockedUser
  }

  const updatedUser = {
    id: 1,
    name: 'AnUpDaTeDuSeR',
    policies: [{
      id: 2,
      name: 'AnOtHeRpOlIcY'
    }],
    teams: [{
      id: 2,
      name: 'AnOtHeRtEaM'
    }]
  }

  const newUser = {
    id: 3,
    name: 'AnEwUsEr',
    policies: [],
    teams: []
  }

  lab.test('should return initial state', (done) => {
    Code.expect(
      reducer(undefined, {})
    ).to.equal(
      initialState
    )

    done()
  })

  lab.test('should handle RECEIVE_USERS', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_USERS,
        users: mockedUsers
      })
    ).to.equal({
      list: mockedUsers
    })

    done()
  })

  lab.test('should handle RECEIVE_USER', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_USER,
        user: mockedUser
      })
    ).to.equal({
      list: null,
      selectedUser: mockedUser
    })

    done()
  })

  lab.test('should handle DELETE_USER', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: DELETE_USER,
        id: mockedUser.id
      })
    ).to.equal({
      list: [mockedUsers[1]],
      selectedUser: null
    })

    done()
  })

  lab.test('should handle UPDATE_USER', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: UPDATE_USER,
        user: updatedUser
      })
    ).to.equal({
      list: [updatedUser, stateWithSelected.list[1]],
      selectedUser: updatedUser
    })

    done()
  })

  lab.test('should handle MAKE_USER', (done) => {
    Code.expect(
      reducer(stateWithSelected, {
        type: MAKE_USER,
        user: newUser
      })
    ).to.equal({
      list: [newUser, mockedUsers[1], mockedUsers[0]],
      selectedUser: newUser
    })

    done()
  })

})
