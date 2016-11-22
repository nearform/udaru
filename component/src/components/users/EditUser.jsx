import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Field, FieldArray, reduxForm, formValueSelector } from 'redux-form'

import Attachments from '../generic/Attachments'

const selector = formValueSelector('EditUser')

@connect(state => {
  return {
    teams: selector(state, 'teams'),
    policies: selector(state, 'policies'),
    selectedTeam: selector(state, 'teamSelector'),
    selectedPolicy: selector(state, 'policySelector')
  }
})

class EditUser extends Component {
  static propTypes = {
    remove: React.PropTypes.func.isRequired,
    selectedTeam: React.PropTypes.string,
    teams: React.PropTypes.array.isRequired,
    teamList: React.PropTypes.array.isRequired,
    policies: React.PropTypes.array.isRequired,
    policyList: React.PropTypes.array.isRequired,
    selectedPolicy: React.PropTypes.string,
    pristine: React.PropTypes.bool.isRequired,
    handleSubmit: React.PropTypes.func.isRequired,
    saveUser: React.PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      hideTeams: true,
      hidePolicies: true
    }

    this.toggle = ::this.toggle
  }

  toggle (which) {
    if (which === 'teams') this.setState({ hideTeams: !this.state.hideTeams })
    else this.setState({ hidePolicies: !this.state.hidePolicies })
  }

  render () {
    return (
      <div className=''>

        <div className='edit--namecontainer edit--flex'>
          <label htmlFor='name' className='edit--flex-left'>User Name: </label>
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
          <FieldArray name='teams'
            component={Attachments}
            fieldName='teams'
            items={this.props.teams}
            available={this.props.teamList}
            title='Teams'
            selected={this.props.selectedTeam}
            selector='teamSelector'
            hide={this.state.hideTeams}
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
            onClick={this.props.handleSubmit(this.props.saveUser)}>
            Save
          </Field>
        </div>

      </div>
    )
  }
}

const validate = values => {
  const errors = {}
  if (!values || !values.name) {
    errors.name = 'Required'
  }
  return errors
}

export default reduxForm({
  form: 'EditUser',
  validate,
  enableReinitialize: true
})(EditUser)
