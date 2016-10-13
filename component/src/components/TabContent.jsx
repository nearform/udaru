import React, { Component } from 'react'
import './List.scss'

import Panel from 'muicss/lib/react/panel'
import Container from 'muicss/lib/react/container'

import Policies from './DetailPolicies'
import Teams from './DetailTeams'
import Users from './DetailUsers'

import Filter from './ListFilter.jsx'
import List from './List.jsx'

// test data
const listData = [
  {
    id: 1,
    name: 'one item'
  },
  {
    id: 2,
    name: 'another item'
  },
  {
    id: 3,
    name: 'and another'
  }
]

export default class TabContent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      selected: null,
      list: listData,
      filtered: listData
    }
  }

  filterChanged(filter) {
    const filtered = this.state.list.filter(item => {
      if (item.name.indexOf(filter) > -1) return item
    })
    this.setState({ filtered })
  }

  render() {
    const detailComponent = whichTab(this.props.page)

    // show selection for demo purposes
    let selection = this.state.selected
    if (selection) selection = (
      <p>Currently selected item: {selection.name}</p>
    )

    return (
      <Panel>
        <Container className='listMain'>
          <Filter onFilterChange={this.filterChanged.bind(this)} />
          <List
            onItemSelect={selected => this.setState({selected})}
            items={this.state.filtered} />
        </Container>
        {detailComponent}
        {selection}
      </Panel>
    )
  }
}

function whichTab (tabName) {
  switch (tabName) {
    case 'Policies': return <Policies />
    case 'Teams': return <Teams />
    case 'Users': return <Users />
  }
}
