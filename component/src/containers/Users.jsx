import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'
// import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

// import { callApi } from '../middleware/api'

import List from '../components/generic/list'
import EditUser from '../components/users/EditUser'

import { users as testData } from '../components/users/testData'

@connect(({ users }) => ({
  _users: users.list
}))
@resolve('users', (props) => {
  return Promise.resolve(testData) // return callApi('/users')
})
export default class Users extends Component {
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
    //   url: '/user' + selected.id,
    //   data: data
    // }).then(res => {
    //
    // })
    console.log('Attempted to save:', data)
  }

  edit (selected) {
    // get this user's data
    // callApi('/user/' + selected.id).then((data) => {
    //   console.log(data);
    // })

    this.setState({
      user: selected
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
          <Col md='10'>
            {user && <EditUser onSubmit={this.save} initialValues={user} />}
          </Col>
        </Row>
      </Container>
    )
  }
}

// Users.WrappedComponent.propTypes = {
//   users: React.PropTypes.object.isRequired
// }
