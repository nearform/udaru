import React from 'react'
import { Field } from 'redux-form'

const selectOptions = (item, i) => {
  return (
    <option name={item.name}
      key={item.id}
      value={i + 1}>
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
      <div className='edit--flex'>
        <label htmlFor={selector}
          className='edit--flex-left'>
          {title}:
        </label>

        <Field name={selector}
          component='select'
          className='edit--flex-mid edit--select'>
          {available.map(selectOptions)}
        </Field>

        <div className='edit--flex-right'>
          <button name='attach'
            onClick={attach}
            type='button'
            className='edit--applybutton'
            hidden={available.length === 0}>
            Attach
          </button>
        </div>
      </div>

      <div hidden={items.length === 0}
        className='edit--showhidecontainer'
        onClick={toggleAttachments}>
        <span className='edit--showhide-text'>
          {hide ? 'Show' : 'Hide'} {title}
        </span>
        <i className={hide ? 'edit--caret-right' : 'edit--caret-down'} />
      </div>

      <div className='edit--attachmentcontainer' hidden={hide}>
        <div className='edit--attachmentflex' hidden={hide}>
          {fields.map((member, i) =>
            <span key={i} className='edit--attachmentitem'>
              <Field type='text'
                component='text'
                name='attachments'>
                {items[i].name}
              </Field>
              <Field type='text'
                component='text'
                name='trash'
                onClick={() => fields.remove(i)}
                className='edit--attachmenttrash'
              />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

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
