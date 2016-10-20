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

@connect(({ users }) => ({
  _users: users.list
}))
@resolve('users', (props) => {
  return Promise.resolve(callApi('/authorization/users').then((data) => {
    return data.result
  }))
})
export default class Users extends Component {
  static propTypes = {
    users: React.PropTypes.array.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      selected: {}
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
    callApi('/authorization/user/' + selected.id).then(data => {
      if (!data.err) {
        this.setState({
          user: data.result
        })
      }
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
          <Col md='10' className='mainpanel'>
            {user && <EditUser onSubmit={this.save} initialValues={user} />}
          </Col>
        </Row>
      </Container>
    )
  }
}
