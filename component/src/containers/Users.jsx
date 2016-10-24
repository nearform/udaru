import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'
// import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

import { callApi } from '../middleware/api'

import List from '../components/generic/list'
import EditUser from '../components/users/EditUser'

@connect(({ users, policies }) => ({
  _users: users.list,
  _policies: policies.list
}))
@resolve('users', (props) => {
  // return callApi('/authorization/users').then(data => data)
  return callApi('/authorization/users').then(data => data)
})
@resolve('policies', (props) => {
  return callApi('/authorization/policies').then(data => data)
})
export default class Users extends Component {
  static propTypes = {
    users: React.PropTypes.array.isRequired,
    policies: React.PropTypes.array.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      selected: {},
    }

    this.edit = ::this.edit
    this.save = ::this.save
  }

  save (data) {
    // callApi({
    //   method: 'post', // opt.
    //   endpoint: '/authorization/user' + selected.id,
    //   data: data
    // }).then(res => {
    //
    // })
    console.log('Attempted to save:', data)
  }

  edit (selected) {
    callApi('/authorization/user/' + selected.id).then(user => {
      this.setState({
        user
      })
    })
  }

  render () {
    const { user } = this.state

    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            <List
              which='User'
              items={this.props.users}
              onItemSelect={this.edit}
            />
          </Col>
          <div className='user'>
            {user && <EditUser saveUser={this.save}
              initialValues={user}
              policyList={this.props.policies}
            />}
          </div>
        </Row>
      </Container>
    )
  }
}
