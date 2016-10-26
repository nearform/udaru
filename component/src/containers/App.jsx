import React, { Component } from 'react'

import { Link } from 'react-router'
import '../images/logo.png'

export default class App extends Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    const { children } = this.props
    // <img src='../images/logo.png' style={{width: '100%' /* Temp */}} />
    return (
      <div>
        <header className='header'>
          <div className='header--logo'>
            <img src='../images/logo.png' style={{width: '100%'}} />
          </div>
          <div className='header--bar'>
            <div className='header--search-bar'>

            </div>
            <div className='header--nav-bar'>
              <ul className='header--nav-list'>
                <li className='header--nav-item'>
                  <Link className='header--nav-link' activeClassName='header--nav-link-active' to='/users'>Users</Link>
                </li>
                <li className='header--nav-item'>
                  <Link className='header--nav-link' activeClassName='header--nav-link-active' to='/teams'>Teams</Link>
                </li>
                <li className='header--nav-item'>
                  <Link className='header--nav-link' activeClassName='header--nav-link-active' to='/policies'>Policies</Link>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <div className='content'>
          {children}
        </div>
      </div>
    )
  }
}

App.propTypes = {
  children: React.PropTypes.element.isRequired
}
