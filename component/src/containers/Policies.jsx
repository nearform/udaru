import React, { Component } from 'react'
import { Field, reduxForm } from 'redux-form';

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

import PolicyForm from '../components/Policy'

export default class Policies extends Component {
  constructor (props) {
    super(props)

    this.save = ::this.save
  }

  save (data) {
    // create new policy here
  }

  render () {
    return (
      <Container fluid className="">
        <Row>
          <Col md="2">
            // Filter & List here
          </Col>
          <Col md="10">
            <PolicyForm onSubmit={this.save} />
          </Col>
        </Row>
      </Container>
    )
  }
}
