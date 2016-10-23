import React from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'

import Attachments from './Attachments'

let EditUser = (props) => {
  return (
    <div className=''>

      <div className='user--namecontainer user--flex'>
        <label htmlFor='name' className='user--flex-left'>Name: </label>
        <div className='user--flex-mid'>
          <Field name='name'
            component='input'
            type='text'
            placeholder='Name'
            className='user--name-input'
          />
        </div>
        <div className='user--flex-right' />
      </div>

      <div className='user--teamcontainer'>
        <FieldArray name='teams'
          component={Attachments}
          fieldName='teams'
          items={props.teams}
          available={[]}
          title='Teams'
          selected={props.selectedTeam}
          selector='teamSelector'
          hide={props.hideTeams}
          toggle={props.toggle}
        />
      </div>

      <div className='user--policycontainer'>
        <FieldArray name='policies'
          component={Attachments}
          fieldName='policies'
          items={props.policies}
          available={props.policyList}
          title='Policies'
          selected={props.selectedPolicy}
          selector='policySelector'
          hide={props.hidePolicies}
          toggle={props.toggle}
        />
      </div>

      <div className='user--savecontainer'>
        <Field name='submitForm'
          className='user--applybutton'
          hidden={props.pristine}
          component='button'
          type='button'
          onClick={props.handleSubmit(props.saveUser)}>
          Save
        </Field>
      </div>

      <br />
    </div>
  )
}

EditUser.propTypes = {
  selectedTeam: React.PropTypes.string,
  teams: React.PropTypes.array.isRequired,
  hideTeams: React.PropTypes.bool.isRequired,
  toggle: React.PropTypes.func.isRequired,
  policies: React.PropTypes.array.isRequired,
  policyList: React.PropTypes.array.isRequired,
  selectedPolicy: React.PropTypes.string,
  hidePolicies: React.PropTypes.bool.isRequired,
  pristine: React.PropTypes.bool.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  saveUser: React.PropTypes.func.isRequired
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
    return {
      teams: selector(state, 'teams'),
      policies: selector(state, 'policies'),
      selectedTeam: selector(state, 'teamSelector'),
      selectedPolicy: selector(state, 'policySelector')
    }
  }
)(EditUser)

export default reduxForm({
  form: 'EditUser',
  // validate,
  enableReinitialize: true
})(EditUser)
