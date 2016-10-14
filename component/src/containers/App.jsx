import React, { Component } from 'react'

import { Link } from 'react-router';

import Panel from 'muicss/lib/react/panel'
import Container from 'muicss/lib/react/container'
import Row from 'muicss/lib/react/row'
import Col from 'muicss/lib/react/col'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    const { children } = this.props

    return (
      <div>
        <header className="header">
          <div className="header--logo"></div>
          <div className="header--bar">
            <div className="header--search-bar">

            </div>
            <div className="header--nav-bar">
              <ul className="header--nav-list">
                <li className="header--nav-item">
                  <Link to="/users">Users</Link>
                </li>
                <li className="header--nav-item">
                  <Link to="/teams">Teams</Link>
                </li>
                <li className="header--nav-item">
                  <Link to="/policies">Policies</Link>
                </li>
                <li className="header--nav-item">
                  <Link to="/roles">Roles</Link>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <div className="content">
          {children}
        </div>
      </div>
    )
  }
}

App.propTypes = {
  children: React.PropTypes.element.isRequired
}
