import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'

import { fetchUsers, fetchUser, deleteUser, updateUser, makeUser } from '../actions/users'
import { fetchPolicies } from '../actions/policies'
import { fetchTeams } from '../actions/teams'

import List from '../components/generic/list'
import EditUser from '../components/users/EditUser'

@connect(({ users, teams, policies }) => ({
  users: users.list,
  selectedUser: users.selectedUser,
  teams: teams.list,
  policies: policies.list
}), ({
  fetchUser,
  deleteUser,
  updateUser,
  makeUser,
  fetchUsers,
  fetchTeams,
  fetchPolicies
}))

export default class Policies extends Component {
  static propTypes = {
    fetchUser: React.PropTypes.func.isRequired,
    deleteUser: React.PropTypes.func.isRequired,
    updateUser: React.PropTypes.func.isRequired,
    makeUser: React.PropTypes.func.isRequired,
    fetchUsers: React.PropTypes.func.isRequired,
    fetchTeams: React.PropTypes.func.isRequired,
    fetchPolicies: React.PropTypes.func.isRequired,
    users: React.PropTypes.array,
    selectedUser: React.PropTypes.object,
    teams: React.PropTypes.array,
    policies: React.PropTypes.array
  }

  constructor (props) {
    super(props)

    this.state = {
      selected: {},
      addName: ''
    }

    this.edit = ::this.edit
    this.save = ::this.save
    this.remove = ::this.remove
    this.make = ::this.make
    this.addNameChanged = ::this.addNameChanged
  }

  componentDidMount () {
    this.props.fetchUsers()
    // temporary workaround for Hapi back-end issue:
    // 'Error: reply interface called twice'
    setTimeout(() => {
      this.props.fetchPolicies()
      setTimeout(() => {
        this.props.fetchTeams()
      }, 500)
    }, 500)
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

  make () {
    if (this.state.addName) this.props.makeUser(this.state.addName)
    this.setState({ addName: '' })
  }

  addNameChanged (input) {
    this.setState({ addName: input.target.value })
  }

  render () {
    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            {this.props.users && <List
              which='User'
              make={this.make}
              items={this.props.users}
              onItemSelect={this.edit}
              showAddPanel
              selectedItem={this.props.selectedUser}
              addNameChanged={this.addNameChanged}
              addNameValue={this.state.addName} />
            }
          </Col>
          <div className='edit'>
            {this.props.selectedUser && <EditUser saveUser={this.save}
              initialValues={this.props.selectedUser}
              policyList={this.props.policies}
              teamList={this.props.teams}
              remove={this.remove}
            />}
          </div>
        </Row>
      </Container>
    )
  }
}
