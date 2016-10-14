import React, { Component } from 'react'

import Panel from 'muicss/lib/react/panel'
import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

import './App.scss'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    const { children } = this.props

    return (
      <div>
        <header></header>

        <Container fluid style={{padding: 0}}>
          <Row>
            <Col xs="12">
              <Panel>
                {children}
              </Panel>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}

App.propTypes = {
  children: React.PropTypes.element.isRequired
}
