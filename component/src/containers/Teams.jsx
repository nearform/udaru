import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'

import { fetchTeams, fetchTeam, deleteTeam, updateTeam, makeTeam } from '../actions/teams'
import { fetchPolicies } from '../actions/policies'
import { fetchUsers } from '../actions/users'

import List from '../components/generic/list'
import EditTeam from '../components/teams/EditTeam'

@connect(({ users, teams, policies }) => ({
  users: users.list,
  selectedTeam: teams.selectedTeam,
  teams: teams.list,
  policies: policies.list
}), ({
  fetchTeam,
  deleteTeam,
  updateTeam,
  makeTeam,
  fetchTeams,
  fetchUsers,
  fetchPolicies
}))

export default class Policies extends Component {
  static propTypes = {
    fetchTeam: React.PropTypes.func.isRequired,
    deleteTeam: React.PropTypes.func.isRequired,
    updateTeam: React.PropTypes.func.isRequired,
    makeTeam: React.PropTypes.func.isRequired,
    fetchTeams: React.PropTypes.func.isRequired,
    fetchUsers: React.PropTypes.func.isRequired,
    fetchPolicies: React.PropTypes.func.isRequired,
    users: React.PropTypes.array,
    selectedTeam: React.PropTypes.object,
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
    this.props.fetchTeams()
    // temporary workaround for Hapi back-end issue:
    // 'Error: reply interface called twice'
    setTimeout(() => {
      this.props.fetchUsers()
      setTimeout(() => {
        this.props.fetchPolicies()
      }, 500)
    }, 500)
  }

  edit (selected) {
    this.props.fetchTeam(selected.id)
  }

  save (data) {
    this.props.updateTeam(data)
  }

  remove (selected) {
    this.props.deleteTeam(this.props.selectedTeam.id)
  }

  make () {
    if (this.state.addName) this.props.makeTeam(this.state.addName)
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
            {this.props.teams && <List
              which='Team'
              make={this.make}
              items={this.props.teams}
              onItemSelect={this.edit}
              showAddPanel
              selectedItem={this.props.selectedTeam}
              addNameChanged={this.addNameChanged}
              addNameValue={this.state.addName} />
            }
          </Col>
          <div className='edit'>
            {this.props.selectedTeam && <EditTeam saveTeam={this.save}
              initialValues={this.props.selectedTeam}
              policyList={this.props.policies}
              userList={this.props.users}
              remove={this.remove}
            />}
          </div>
        </Row>
      </Container>
    )
  }
}
