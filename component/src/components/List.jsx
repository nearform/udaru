import React from 'react'
import ListItem from './ListItem'

export default (props) => {
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
