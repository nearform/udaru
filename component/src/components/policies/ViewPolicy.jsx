import React from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

const renderStatements = (statements) => {
  if (!statements || !Array.isArray(statements)) return null

  return statements.map(({ Effect: effect, Action: actions, Resource: resources }, index) => (
    <Container key={index} className='view-policy--statement'>
      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Effect :</label>
        </Col>
        <Col xs='12' sm='8'>
          <span>{effect}</span>
        </Col>
      </Row>

      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Actions :</label>
        </Col>
        <Col xs='12' sm='8'>
          <ul className='view-policy--actions'> {
            actions.map((action, index) => <li key={index}>{action}</li>)
          } </ul>
        </Col>
      </Row>

      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Resources :</label>
        </Col>
        <Col xs='12' sm='8'>
          <ul className='view-policy--resources'> {
            resources.map((resource, index) => <li key={index}>{resource}</li>)
          } </ul>
        </Col>
      </Row>
    </Container>
  ))
}

const ViewPolicy = ({ policy }) => (
  <Container className='view-policy'>
    <Row className='view-policy--row view-policy--row-dark'>
      <Col xs='12' sm='2'>
        <label>Name :</label>
      </Col>
      <Col xs='12' sm='8'>
        <span>{policy.name}</span>
      </Col>
    </Row>

    <Row className='view-policy--row view-policy--row-dark'>
      <Col xs='12' sm='2'>
        <label>Version :</label>
      </Col>
      <Col xs='12' sm='8'>
        <span>{policy.version}</span>
      </Col>
    </Row>

    <Row>
      <Col xs='12' className='view-policy--statements'>
        {renderStatements(policy.statements)}
      </Col>
    </Row>
  </Container>
)

ViewPolicy.propTypes = {
  policy: React.PropTypes.object.isRequired
}

export default ViewPolicy
