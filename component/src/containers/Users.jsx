import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'

import { fetchUsers, fetchUser, deleteUser } from '../actions/users'
import { fetchPolicies } from '../actions/policies'

import List from '../components/generic/list'
import EditUser from '../components/users/EditUser'

@connect(({ users, policies }) => ({
  users: users.list,
  selectedUser: users.selectedUser,
  policies: policies.list
}), ({
  fetchUser,
  deleteUser,
  fetchUsers,
  fetchPolicies
}))

export default class Policies extends Component {
  // static propTypes = {
  //   policies: React.PropTypes.array.isRequired
  // }

  constructor (props) {
    super(props)

    this.state = {
      selected: {}
    }

    this.edit = ::this.edit
    this.save = ::this.save
    this.remove = ::this.remove
  }

  componentDidMount () {
    this.props.fetchUsers()
    // temporary workaround for Hapi back-end issue:
    // 'Error: reply interface called twice'
    setTimeout(() => {
      this.props.fetchPolicies()
    }, 1)
  }

  edit (selected) {
    this.props.fetchUser(selected.id)
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

  remove (selected) {
    this.props.deleteUser(this.props.selectedUser.id)
    // callApi({
    //   method: 'delete',
    //   endpoint: '/authorization/user/' + this.state.user.id
    // }).then(res => {
    //   console.log(res)
    // })
  }

  render () {
    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            { this.props.users && <List
              which='User'
              items={this.props.users}
              onItemSelect={this.edit} />
            }
          </Col>
          <div className='user'>
            {this.props.selectedUser && <EditUser saveUser={this.save}
              initialValues={this.props.selectedUser}
              policyList={this.props.policies}
              remove={this.remove}
            />}
          </div>
        </Row>
      </Container>
    )
  }
}
