import React, { Component } from 'react'

class FilterList extends Component {
  constructor (props) {
    super(props)

    this.state = { filter: '' }

    this.onInputChange = ::this.onInputChange
  }

  render () {
    return (
      <input
        placeholder='Filter results'
        value={this.state.filter}
        onChange={this.onInputChange} />
    )
  }

  onInputChange (input) {
    this.setState({filter: input.target.value})
    this.props.onFilterChange(input.target.value)
  }
}

FilterList.propTypes = {
  onFilterChange: React.PropTypes.func.isRequired
}

export default FilterList
