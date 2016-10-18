import React, { Component } from 'react'

class FilterInput extends Component {
  constructor (props) {
    super(props)

    this.state = { filter: '' }

    this.onInputChange = ::this.onInputChange
  }

  onInputChange (input) {
    this.setState({filter: input.target.value})
    this.props.onFilterChange(input.target.value)
  }

  render () {
    return (
      <input type='text'
        onChange={this.onInputChange}
        placeholder='Filter Users'
        className='filterlist--filter-input'
      />
    )
  }
}

FilterInput.propTypes = {
  onFilterChange: React.PropTypes.func.isRequired
}

export default FilterInput
