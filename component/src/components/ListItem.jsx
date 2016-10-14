import React from 'react'

import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

const ListItem = ({item, onItemSelect}) => {
  function clicked () {
    onItemSelect(item)
  }
  return (
    <Row onClick={clicked}>
      <Col>
        {item.name}
      </Col>
    </Row>
  )
}

ListItem.propTypes = {
  item: React.PropTypes.object.isRequired,
  onItemSelect: React.PropTypes.func.isRequired
}

export default ListItem
