import React from 'react'

const Filter = (props) => (
  <div className='filterlist--filter-wrapper'>
    <i className='fa fa-search filterlist--filter-icon'></i>
    <input type='text'
      onChange={props.filterChanged}
      placeholder={'Search ' + props.which + '...'}
      className='filterlist--filter-input'
      value={props.filter}
    />
  </div>
)

Filter.propTypes = {
  filterChanged: React.PropTypes.func.isRequired,
  which: React.PropTypes.string.isRequired,
  filter: React.PropTypes.string
}

export default Filter
