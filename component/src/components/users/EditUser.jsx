import React from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'

let EditUser = ({ onSubmit, handleSubmit, pristine, teams, policies }) => {
  const renderTeams = ({ fields }) => (
    <div>
      {fields.map((member, i) =>
        <span key={i} className='attached--item-display'>
          <Field type='text' component='text' name='team'>{teams[i].name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Field>
          <button onClick={() => fields.remove(i)}>&#10006;</button>
        </span>
      )}
    </div>
  )

  // reuse the team code above once it's been properly refactored
  const renderPolicies = ({ fields }) => (
    <div>
      {fields.map((member, i) =>
        <span key={i} className='attached--item-display'>
          <Field type='text' component='text' name='policy'>{policies[i].name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Field>
          <button onClick={() => fields.remove(i)}>&#10006;</button>
        </span>
      )}
    </div>
  )

  // <Field type='button' component='button' name='apolicy' key={i} onClick={() => fields.push(newpol)}>{policies[i].name}</Field>

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className=''>
          <label htmlFor='name'>Name: </label>
          <Field name='name' component='input' type='text' placeholder='Name' className='filterlist--filter-input' />
        </div>
        <hr />
        <div className=''>
          <label htmlFor='teamsearch'>Teams: </label>
          <Field name='teamsearch' component='input' type='text' placeholder='PLACEHOLDER' disabled />
        </div>
        <br />
        <label htmlFor='teams'>Teams: </label>
        <div className='attached--items'>
          <FieldArray name='teams' component={renderTeams} />
        </div>
        <br />
        <hr />
        <div className=''>
          <label htmlFor='policysearch'>Policies: </label>
          <Field name='policysearch' component='input' type='text' placeholder='PLACEHOLDER' disabled />
        </div>
        <br />
        <label htmlFor='policies'>Policies: </label>
        <div className='attached--items'>
          <FieldArray name='policies' component={renderPolicies} />
        </div>
        <hr hidden={pristine} />
        <button type='submit' hidden={pristine}>Save</button>
        <br />
      </form>
    </div>
  )
}

EditUser.propTypes = {
  onSubmit: React.PropTypes.func.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  pristine: React.PropTypes.bool.isRequired,
  teams: React.PropTypes.array.isRequired,
  policies: React.PropTypes.array.isRequired
}

// const validate = values => {
//   const errors = {}
//   if (!values.name) {
//     errors.name = 'Required'
//   }
//   return errors
// }

const selector = formValueSelector('EditUser')

EditUser = connect(
  state => {
    const teams = selector(state, 'teams')
    const policies = selector(state, 'policies')
    return {
      teams,
      policies
    }
  }
)(EditUser)

export default reduxForm({
  form: 'EditUser',
  // validate,
  enableReinitialize: true
})(EditUser)
