import React from 'react'

const Dropdown = (props) => {
  const items = props.data.map(item => {
    return <option key={item.id} value={item.name}>{item.name}</option>
  })

  return (
    <select>
      {items}
    </select>
  )
}

Dropdown.propTypes = {
  data: React.PropTypes.array.isRequired
}

export default Dropdown
