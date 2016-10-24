import React, { Component } from 'react'

import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'
// import { connect } from 'react-redux'
// import { push } from 'react-router-redux'
import { resolve } from 'react-resolver'

// import { callApi } from '../middleware/api'

import List from '../components/generic/list'
import ViewTeam from '../components/teams/ViewTeam'

@resolve('teams', (props) => (
  [{id: 1, name: 'Admins'}]
))
export default class Teams extends Component {
  static propTypes = {
    teams: React.PropTypes.array.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {
      selected: {}
    }

    this.viewTeam = ::this.viewTeam
  }

  viewTeam (selected) {
    this.setState({team: selected})
  }

  render () {
    const { team } = this.state

    return (
      <Container fluid className=''>
        <Row>
          <Col md='2'>
            <List
              which='Team'
              items={this.props.teams}
              onItemSelect={this.viewTeam}
            />
          </Col>
          <Col md='10'>
            {team && <ViewTeam team={team} />}
          </Col>
        </Row>
      </Container>
    )
  }
}
