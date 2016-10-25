import React, { Component } from 'react'

export default (props) => (
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
