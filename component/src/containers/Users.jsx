import React, { Component } from 'react'

import List from '../components/generic/list/List'
import Detail from '../components/DetailUsers'

import { userData } from '../testData'

export default class Users extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: {},
      list: userData
    }

    this.itemSelected = ::this.itemSelected
  }

  itemSelected (selected) {
    this.setState({ selected })
  }

  render () {
    return (
      <div className='mainpanel'>
        <div className='filterlist'>
          <List
            onItemSelect={this.itemSelected}
            items={this.state.list}
          />
        </div>
        <Detail key={this.state.selected.id} className='detail' selected={this.state.selected} />
      </div>
    )
  }
}
