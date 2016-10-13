import React, { Component } from 'react'

export default class FilterList extends Component {
  constructor(props) {
    super(props)

    this.state = { filter: '' }
  }

  render() {
    return (
      <input
        placeholder='Filter results'
        value={this.state.filter}
        onChange={e => this.onInputChange(e.target.value)} />
    )
  }

  onInputChange(filter) {
    this.setState({filter})
    this.props.onFilterChange(filter)
  }
}
