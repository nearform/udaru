import React from 'react'

const InputEdit = (props) => {
  return (
    <input type='text'
      onChange={props.onFieldChanged}
      defaultValue={props.init}
      className='filterlist--filter-input'
    />
  )
}

InputEdit.propTypes = {
  onFieldChanged: React.PropTypes.func.isRequired,
  init: React.PropTypes.string.isRequired
}

export default InputEdit
