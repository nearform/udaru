import Lab from 'lab'
import Code from 'code'

import reducer from '../../src/reducers/policies'
import { RECEIVE_POLICIES, RECEIVE_POLICY } from '../../src/constants'

const lab = exports.lab = Lab.script()

lab.experiment('policies', () => {
  const initialState = {
    list: null
  }

  const mockedPolicies = [{
    id: 1,
    name: 'Policy 1'
  }, {
    id: 2,
    name: 'Policy 2'
  }]

  const mockedPolicy = {
    id: 1,
    name: 'Policy 1',
    version: 0.1
  }

  lab.test('should return initial state', (done) => {
    Code.expect(
      reducer(undefined, {})
    ).to.equal(
      initialState
    )

    done()
  })

  lab.test('should handle RECEIVE_POLICIES', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_POLICIES,
        policies: mockedPolicies
      })
    ).to.equal({
      list: mockedPolicies
    })

    done()
  })

  lab.test('should handle RECEIVE_POLICY', (done) => {
    Code.expect(
      reducer(initialState, {
        type: RECEIVE_POLICY,
        policy: mockedPolicy
      })
    ).to.equal({
      list: null,
      selectedPolicy: mockedPolicy
    })

    done()
  })

})
