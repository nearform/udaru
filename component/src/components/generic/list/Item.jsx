import React from 'react'

const ListItem = ({item, onItemSelect, selected}) => {
  function clicked () {
    onItemSelect(item)
  }

  const f = selected ? 'filterlist--item-selected' : 'filterlist--item-default'

  return <div className={f} onClick={clicked}>{item.name}</div>
}

ListItem.propTypes = {
  item: React.PropTypes.object.isRequired,
  selected: React.PropTypes.bool.isRequired,
  onItemSelect: React.PropTypes.func.isRequired
}

export default ListItem
