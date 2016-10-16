import React from 'react'

const ListAddItem = (props) => {
  return (
    <div>
      <div>+ Add {props.page} (placeholder)</div>
      <hr />
    </div>
  )
}

ListAddItem.propTypes = {
  page: React.PropTypes.string.isRequired
}

export default ListAddItem
