import React from 'react'

const ViewPolicy = ({ policy }) => (
  <div>
    <div>
      <label>Name :</label>
      <span>{ policy.name }</span>
    </div>
  </div>
)

ViewPolicy.propTypes = {
  policy: React.PropTypes.object.isRequired,
}

export default ViewPolicy
