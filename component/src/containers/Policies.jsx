import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

import { callApi } from '../middleware/api'

import Filter from '../components/ListFilter'
import List from '../components/ListMain'
import PolicyForm from '../components/Policy'

@connect(({ policies }) => ({
  _policies: policies.list
}))
@resolve('policies', (props) => {
  // return callApi('/policies')
  return Promise.resolve([{id:1,name:'Policy 1'}])
})
export default class Policies extends Component {
  constructor (props) {
    super(props)

    this.state = {
      selected: {},
      filtered: props.policies
    }

    this.filterChanged = ::this.filterChanged
    this.itemSelected = ::this.itemSelected
    this.save = ::this.save
  }

  componentDidMount() {

  }

  itemSelected (selected) {
    this.setState({ selected })
  }

  filterChanged (filter) {
    filter = filter.toLowerCase()
    const filtered = this.props.policies.filter(item => ~item.name.toLowerCase().indexOf(filter))
    this.setState({ filtered })
  }

  save (data) {
    // create new policy here

  }

  render () {
    return (
      <Container fluid className="">
        <Row>
          <Col md="2">
            <Filter onFilterChange={this.filterChanged} />
            <List
              selected={this.state.selected}
              onItemSelect={this.itemSelected}
              items={this.state.filtered}
            />
          </Col>
          <Col md="10">
            <PolicyForm onSubmit={this.save} />
          </Col>
        </Row>
      </Container>
    )
  }
}
