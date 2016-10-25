import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'

import { fetchUsers, fetchUser, deleteUser, updateUser, makeUser } from '../actions/users'
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
  updateUser,
  makeUser,
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
    this.make = ::this.make
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
    this.props.updateUser(data)
  }

  remove (selected) {
    this.props.deleteUser(this.props.selectedUser.id)
  }

  make (username) {
    this.props.makeUser('ThEnEwGuY')
  }

  render () {
    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            { this.props.users && <List
              which='User'
              make={this.make}
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
