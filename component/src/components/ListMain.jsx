import React from 'react'
import ListItem from './ListItem'

import AddListItem from './ListAddItem'

const List = (props) => {
  if (props.items.length === 0) return null
  const listItems = props.items.map(item => {
    return (
      <div key={item.id}>
        <ListItem item={item}
          selected={item === props.selected}
          onItemSelect={props.onItemSelect}
        />
        <hr />
      </div>
    )
  })
  return (
    <div className='filterlist--list-items'>
      <AddListItem page='user' />
      {listItems}
    </div>
  )
}

List.propTypes = {
  items: React.PropTypes.array.isRequired,
  selected: React.PropTypes.object.isRequired,
  onItemSelect: React.PropTypes.func.isRequired
}

export default List
