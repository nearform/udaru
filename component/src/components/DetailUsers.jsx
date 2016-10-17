import React, { Component } from 'react'

import Panel from 'muicss/lib/react/panel'

import InputEdit from './InputEditUncontrolled'

import Dropdown from './InputDropdown'

import { teamData, policyData } from '../testData'

class DetailUsers extends Component {
  constructor (props) {
    super(props)

    this.state = {
      name: props.selected.name
    }

    this.nameChanged = ::this.nameChanged
  }

  nameChanged (input) {
    this.setState({name: input})
  }

  render () {
    if (Object.keys(this.props.selected).length === 0) return null
    return (
      <Panel className='detail--panel'>
        Name: <InputEdit onFieldChanged={this.nameChanged}
          init={this.props.selected.name}
        />
        <hr></hr>
        Placeholder stuff ....
        <div>
          Teams: <Dropdown data={teamData} />
        </div>
        <div>
          Policies: <Dropdown data={policyData} />
        </div>
      </Panel>
    )
  }
}

DetailUsers.propTypes = {
  selected: React.PropTypes.object.isRequired
}

export default DetailUsers
