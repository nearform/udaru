import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'

import Attachments from '../generic/Attachments'

const selector = formValueSelector('EditTeam')

@connect(state => {
  return {
    teams: selector(state, 'teams'),
    policies: selector(state, 'policies'),
    selectedUser: selector(state, 'userSelector'),
    selectedPolicy: selector(state, 'policySelector')
  }
})

class EditTeam extends Component {
  constructor (props) {
    super(props)

    this.state = {
      hideUsers: true,
      hidePolicies: true
    }

    this.toggle = ::this.toggle
  }

  toggle (which) {
    if (which === 'users') this.setState({ hideUsers: !this.state.hideUsers })
    else this.setState({ hidePolicies: !this.state.hidePolicies })
  }

  render () {
    return (
      <div className=''>

        <div className='edit--namecontainer edit--flex'>
          <label htmlFor='name' className='edit--flex-left'>Team Name: </label>
          <div className='edit--flex-mid'>
            <Field name='name'
              component='input'
              type='text'
              placeholder='Name'
              className='edit--name-input'
            />
          </div>
          <div className='edit--flex-right'>
            <i className='edit--delete' onClick={this.props.remove} />
          </div>
        </div>

        <div className='edit--teamcontainer'>
          <FieldArray name='users'
            component={Attachments}
            fieldName='users'
            items={this.props.users}
            available={this.props.userList}
            title='Users'
            selected={this.props.selectedUser}
            selector='userSelector'
            hide={this.state.hideUsers}
            toggle={this.toggle}
          />
        </div>

        <div className='edit--policycontainer'>
          <FieldArray name='policies'
            component={Attachments}
            fieldName='policies'
            items={this.props.policies}
            available={this.props.policyList}
            title='Policies'
            selected={this.props.selectedPolicy}
            selector='policySelector'
            hide={this.state.hidePolicies}
            toggle={this.toggle}
          />
        </div>

        <div className='edit--savecontainer'>
          <Field name='submitForm'
            className='edit--applybutton'
            hidden={this.props.pristine}
            component='button'
            type='button'
            onClick={this.props.handleSubmit(this.props.saveTeam)}>
            Save
          </Field>
        </div>

      </div>
    )
  }
}

EditTeam.propTypes = {
  remove: React.PropTypes.func.isRequired,
  users: React.PropTypes.array.isRequired,
  userList: React.PropTypes.array.isRequired,
  policies: React.PropTypes.array.isRequired,
  policyList: React.PropTypes.array.isRequired,
  selectedUser: React.PropTypes.string,
  teamList: React.PropTypes.array.isRequired,
  selectedPolicy: React.PropTypes.string,
  pristine: React.PropTypes.bool.isRequired,
  handleSubmit: React.PropTypes.func.isRequired,
  saveTeam: React.PropTypes.func.isRequired
}

// const validate = values => {
//   const errors = {}
//   if (!values.name) {
//     errors.name = 'Required'
//   }
//   return errors
// }

export default reduxForm({
  form: 'EditTeam',
  // validate,
  enableReinitialize: true
})(EditTeam)
