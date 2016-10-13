import React from 'react'

import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

const ListItem = ({item, onItemSelect}) => {
  return (
    <Row key={item.id} onClick={() => onItemSelect(item)}>
      <Col>
        {item.name}
      </Col>
    </Row>
  )
}

export default ListItem
