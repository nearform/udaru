import React from 'react'
import { Field } from 'redux-form'

const selectOptions = (item) => {
  return (
    <option name={item.name}
      key={item.id}
      value={item.id}>
      {item.name}
    </option>
  )
}

const RenderItems = (props) => {
  const { fields, items, fieldName, available, title } = props
  const { selected, selector, hide, toggle } = props
  const toggleAttachments = () => {
    toggle(fieldName)
  }

  const attach = () => {
    const newItem = available[selected - 1 || 0]
    const found = items.find(function (item) {
      if (item && newItem) return item.id === newItem.id
    })
    if (!found) fields.push(newItem)
  }

  return (
    <div>
      <div className='user--flex'>
        <label htmlFor={selector}
          className='user--flex-left'>
          {title}:
        </label>

        <Field name={selector}
          component='select'
          className='user--flex-mid user--select'>
          {available.map(selectOptions)}
        </Field>

        <div className='user--flex-right'>
          <button name='attach'
            onClick={attach}
            type='button'
            className='user--applybutton'
            hidden={available.length === 0}>
            Attach
          </button>
        </div>
      </div>

      <div hidden={items.length === 0}
        className='user--showhidecontainer'
        onClick={toggleAttachments}>
        <span className='user--showhide-text'>
          {hide ? 'Show' : 'Hide'} {title}
        </span>
        <i className={hide ? 'user--caret-right' : 'user--caret-down'} />
      </div>

      <div className='user--attachmentcontainer' hidden={hide}>
        <div className='user--attachmentflex' hidden={hide}>
          {fields.map((member, i) =>
            <span key={i} className='user--attachmentitem'>
              <Field type='text'
                component='text'
                name='attachments'>
                {items[i].name}
              </Field>
              <Field type='text'
                component='text'
                name='trash'
                onClick={() => fields.remove(i)}
                className='user--attachmenttrash'
              />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// <button name='attach'
//   onClick={attach}
//   type='button'
//   className='user--applybutton'
//   hidden={available.length === 0}>
//   Attach
// </button>

// <Field name='attach'
//   component='button'
//   onClick={attach}
//   className='user--applybutton'
//   hidden={available.length === 0}>
//   Attach
// </Field>

RenderItems.propTypes = {
  fields: React.PropTypes.object.isRequired,
  items: React.PropTypes.array.isRequired,
  fieldName: React.PropTypes.string.isRequired,
  available: React.PropTypes.array.isRequired,
  title: React.PropTypes.string.isRequired,
  selected: React.PropTypes.string,
  selector: React.PropTypes.string.isRequired,
  hide: React.PropTypes.bool.isRequired,
  toggle: React.PropTypes.func.isRequired
}

export default RenderItems
