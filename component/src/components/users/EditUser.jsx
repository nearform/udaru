import React from 'react'
import { Field, FieldArray, reduxForm } from 'redux-form'

const EditUser = ({ onSubmit, handleSubmit, pristine }) => {
  const renderTeams = ({ fields }) => (
    <div>
      {fields.map((member, i) =>
        <Field type='button' component='button' name='ateam' key={i} />
      )}
    </div>
  )

  const renderPolicies = ({ fields }) => (
    <div>
      {fields.map((member, i) =>
        <Field type='button' component='button' name='apolicy' key={i} />
      )}
    </div>
  )

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className=''>
          <label htmlFor='name'>Name: </label>
          <Field name='name' component='input' type='text' placeholder='Name' />
        </div>
        <hr />
        <div className=''>
          <label htmlFor='teamsearch'>Teams: </label>
          <Field name='teamsearch' component='input' type='text' placeholder='PLACEHOLDER' disabled />
        </div>
        <div className=''>
          <label htmlFor='teams'>Teams: </label>
          <FieldArray name='teams' component={renderTeams} />
        </div>
        <div className=''>
          <label htmlFor='policysearch'>Policies: </label>
          <Field name='policysearch' component='input' type='text' placeholder='PLACEHOLDER' disabled />
        </div>
        <div className=''>
          <label htmlFor='policies'>Policies: </label>
          <FieldArray name='policies' component={renderPolicies} />
        </div>
        <hr hidden={pristine} />
        <button type='submit' hidden={pristine}>Save</button>
      </form>
    </div>
  )
}

EditUser.propTypes = {
  onSubmit: React.PropTypes.func.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  pristine: React.PropTypes.bool.isRequired
}

// const validate = values => {
//   const errors = {}
//   if (!values.name) {
//     errors.name = 'Required'
//   }
//   return errors
// }

export default reduxForm({
  form: 'user',
  // validate,
  enableReinitialize: true
})(EditUser)
