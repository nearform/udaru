import React, { Component } from 'react'
import Container from 'muicss/lib/react/container'
import Tabs from 'muicss/lib/react/tabs'
import Tab from 'muicss/lib/react/tab'
// import './Home.scss'

import TabContent from './TabContent'

const tabNames = ['Policies', 'Teams', 'Users']
const tabComponents = tabNames.map((item) => {
  return <Tab value={item} label={item} key={item} />
})

export default class AdminMain extends Component {
  constructor (props) {
    super(props)

    this.state = {
      tabIndex: 2,
      tabName: tabNames[2]
    }

    this.onChange = ::this.onChange
  }

  onChange (i, value, tab, ev) {
    this.setState({
      tabIndex: i,
      tabName: value
    })
  }

  render () {
    return (
      <Container>
        <Tabs onChange={this.onChange} initialSelectedIndex={this.state.tabIndex}>
          {tabComponents}
        </Tabs>
        <TabContent page={this.state.tabName} />
      </Container>
    )
  }
}
