import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'

import { fetchPolicies, fetchPolicy } from '../actions/policies'

import List from '../components/generic/list'
import ViewPolicy from '../components/policies/ViewPolicy'

@connect(({ policies }) => ({
  policies: policies.list,
  selectedPolicy: policies.selectedPolicy
}), ({
  fetchPolicy,
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

    this.viewPolicy = ::this.viewPolicy
  }

  componentDidMount () {
    this.props.fetchPolicies()
  }

  viewPolicy (selected) {
    this.props.fetchPolicy(selected.id)
  }

  render () {
    const { policies, selectedPolicy } = this.props

    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            { policies && <List
              which='Policy'
              items={policies}
              onItemSelect={this.viewPolicy} />
            }
          </Col>
          <Col md='10'>
            {selectedPolicy && <ViewPolicy policy={selectedPolicy} />}
          </Col>
        </Row>
      </Container>
    )
  }
}
