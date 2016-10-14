import React from 'react'
import ListItem from './ListItem'

const List = (props) => {
  if (props.items.length === 0) return null
  const listItems = props.items.map(item => {
    return (
      <ListItem
        onItemSelect={props.onItemSelect}
        key={item.id}
        item={item} />
    )
  })
  return (
    <div>
      {listItems}
    </div>
  )
}

List.propTypes = {
  items: React.PropTypes.array.isRequired,
  onItemSelect: React.PropTypes.func.isRequired
}

export default List
