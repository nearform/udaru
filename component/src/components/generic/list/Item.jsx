import React from 'react'

const ListItem = ({item, onItemSelect, selected}) => {
  function clicked () {
    onItemSelect(item)
  }

  const selectedClass = selected ? 'filterlist--item-selected' : ''

  return (
    <li className={'filterlist--item ' + selectedClass} onClick={clicked}>
      {item.name}
    </li>
  )
}

ListItem.propTypes = {
  item: React.PropTypes.object.isRequired,
  selected: React.PropTypes.bool.isRequired,
  onItemSelect: React.PropTypes.func.isRequired
}

export default ListItem
