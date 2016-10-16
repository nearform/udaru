import React, { Component } from 'react'
import Filter from '../components/ListFilter'
import List from '../components/ListMain'
import Detail from '../components/DetailUsers'

import { userData } from '../testData'

export default class Users extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: {},
      list: userData,
      filtered: userData
    }

    this.filterChanged = ::this.filterChanged
    this.itemSelected = ::this.itemSelected
  }

  itemSelected (selected) {
    this.setState({ selected })
  }

  filterChanged (filter) {
    const filtered = this.state.list.filter(item => {
      if (item.name.toLowerCase().indexOf(filter.toLowerCase()) > -1) return item
    })
    this.setState({ filtered })
  }

  render () {
    return (
      <div className='mainpanel'>
        <div className='filterlist'>
          <Filter onFilterChange={this.filterChanged} />
          <List
            selected={this.state.selected}
            onItemSelect={this.itemSelected}
            items={this.state.filtered}
          />
        </div>
        <Detail key={this.state.selected.id} className='detail' selected={this.state.selected} />
      </div>
    )
  }
}
