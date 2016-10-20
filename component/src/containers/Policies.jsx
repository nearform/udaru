import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'
// import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

// import { callApi } from '../middleware/api'

import List from '../components/generic/list'
import ViewPolicy from '../components/policies/ViewPolicy'

@connect(({ policies }) => ({
  _policies: policies.list
}))
@resolve('policies', (props) => {
  // return callApi('/policies')
  return Promise.resolve([{id: 1, name: 'Policy 1'}, {id: 2, name: 'Policy 2'}])
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

  viewPolicy (selected) {
    // Load policy details here, currently setting stubbed data

    const policy = {
      ...selected,
      effect: 'Allow',
      action: 'iam:someAction',
      resource: '/a/b/cccc'
    }

    this.setState({
      policy
    })

    // callApi('/policy/' + selected.id).then((data) => {
    //   console.log(data);
    // })
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
