import React from 'react'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

const ViewTeam = ({ team }) => (
  <Container>
    <Row>
      <Col xs='12' sm='2'>
        <label>Team Name :</label>
      </Col>
      <Col xs='12' sm='8'>
        <Field component='input' placeholder='Team Name' name='team_name' />
        <span></span>
      </Col>
    </Row>

    <Row>
      <Col xs='12' sm='2'>
        <label>Description :</label>
      </Col>
      <Col xs='12' sm='8'>
        <Field component='input' placeholder='Team Description' name='team_desc' />
        <span></span>
      </Col>
    </Row>
  </Container>
)

ViewTeam.propTypes = {
  team: React.PropTypes.object
}

export default reduxForm({
  form: 'TeamForm',
})(ViewTeam)
