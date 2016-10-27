import Lab from 'lab'
import Code from 'code'

import reducer from '../../src/reducers/users'
import { RECEIVE_USERS, RECEIVE_USER, DELETE_USER } from '../../src/constants'

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

  // more to add.
})
