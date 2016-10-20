import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'
// import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

import { callApi } from '../middleware/api'

import List from '../components/generic/list'
import ViewPolicy from '../components/policies/ViewPolicy'

@connect(({ policies }) => ({
  _policies: policies.list
}))
@resolve('policies', (props) => {
  return callApi('/authorization/policies').then(data => data.result)
})
export default class Policies extends Component {
  static propTypes = {
    policies: React.PropTypes.array.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      selected: {}
    }

    this.viewPolicy = ::this.viewPolicy
  }

  componentDidMount () {

  }

  viewPolicy (selected) {
    callApi('/authorization/policies/' + selected.id)
    .then(data => data.result)
    .then(policy => {
      this.setState({ policy })
    })
  }

  render () {
    const { policy } = this.state

    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            <List
              which='Policy'
              items={this.props.policies}
              onItemSelect={this.viewPolicy}
            />
          </Col>
          <Col md='10'>
            {policy && <ViewPolicy policy={policy} />}
          </Col>
        </Row>
      </Container>
    )
  }
}
