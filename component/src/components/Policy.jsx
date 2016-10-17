import React from 'react'
import { Field, reduxForm } from 'redux-form'

const PolicyForm = ({ onSubmit, handleSubmit }) => (
  <div>
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field name="name" component="input" type="text" placeholder="Policy Name" />
      <button type="submit">Save</button>
    </form>
  </div>
)

PolicyForm.propTypes = {
  onSubmit: React.PropTypes.function.isRequired,
  handleSubmit: React.PropTypes.function.isRequired
}

export default reduxForm({
  form: 'policy'
})(PolicyForm)
