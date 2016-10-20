import React from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

const renderStatements = (statements) => {
  if (!statements || !Array.isArray(statements)) return null

  return statements.map(({ Effect, Action: Actions, Resource: Resources}, index) => (
    <Container key={index} className='view-policy--statement'>
      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Effect :</label>
        </Col>
        <Col xs='12' sm='8'>
          <span>{Effect}</span>
        </Col>
      </Row>

      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Actions :</label>
        </Col>
        <Col xs='12' sm='8'>
          <ul className='view-policy--actions'> {
            Actions.map((action, index) => <li key={index}>{action}</li>)
          } </ul>
        </Col>
      </Row>

      <Row className='view-policy--row'>
        <Col xs='12' sm='2'>
          <label>Resources :</label>
        </Col>
        <Col xs='12' sm='8'>
          <ul className='view-policy--resources'> {
            Resources.map((resource, index) => <li key={index}>{resource}</li>)
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
        <span>{policy.Name}</span>
      </Col>
    </Row>

    <Row className='view-policy--row view-policy--row-dark'>
      <Col xs='12' sm='2'>
        <label>Version :</label>
      </Col>
      <Col xs='12' sm='8'>
        <span>{policy.Version}</span>
      </Col>
    </Row>

    <Row>
      <Col xs='12'>
        { renderStatements(policy.Statement) }
      </Col>
    </Row>
  </Container>
)

ViewPolicy.propTypes = {
  policy: React.PropTypes.object.isRequired
}

export default ViewPolicy
