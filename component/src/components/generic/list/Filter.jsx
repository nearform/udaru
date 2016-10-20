import React, { Component } from 'react'

class FilterInput extends Component {
  static propTypes = {
    onFilterChange: React.PropTypes.func.isRequired
  }

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
      <div className='filterlist--filter-wrapper'>
        <i className='fa fa-search filterlist--filter-icon'></i>
        <input type='text'
          onChange={this.onInputChange}
          placeholder='Filter Users'
          className='filterlist--filter-input'
        />
      </div>
    )
  }
}

export default FilterInput
