import React, { Component } from 'react'

import Item from './Item'
import Filter from './Filter'

export default class List extends Component {
  constructor (props) {
    super(props)

    this.state = {
      filter: ''
    }

    this.filterChanged = ::this.filterChanged
    this.submitNewItem = ::this.submitNewItem
  }

  filterChanged (filter) {
    this.setState({
      filter: filter.target.value
    })
  }

  submitNewItem (e) {
    e.preventDefault()
    this.props.make()
  }


  render () {
    const selectedItem = this.props.selectedItem ? this.props.selectedItem.id : null
    const filtered = this.props.items.filter(item => ~item.name.toLowerCase().indexOf(this.state.filter))

    const listItems = filtered.map(item => {
      return (
        <Item
          key={item.id}
          item={item}
          selected={item.id === selectedItem}
          onItemSelect={this.props.onItemSelect}
        />
      )
    })

    return (
      <div>
        <Filter filterChanged={this.filterChanged} which={this.props.which} />
        <div hidden={!this.props.showAddPanel}>
          <form onSubmit={this.submitNewItem} className='filterlist--createpanel'>
            Create {this.props.which}
            <input className='filterlist--createpanel-input' type='text' onChange={this.props.addNameChanged} value={this.props.addNameValue} placeholder='Name ...' />
            <button className='filterlist--createpanel-button'>Submit</button>
          </form>
        </div>
        <ul className='filterlist--list-items'>
          {listItems}
        </ul>
      </div>
    )
  }
}

List.propTypes = {
  which: React.PropTypes.string.isRequired,
  items: React.PropTypes.array.isRequired,
  selectedItem: React.PropTypes.object,
  showAddPanel: React.PropTypes.bool.isRequired,
  addNameChanged: React.PropTypes.func,
  addNameValue: React.PropTypes.string,
  onItemSelect: React.PropTypes.func.isRequired,
  make: React.PropTypes.func
}
