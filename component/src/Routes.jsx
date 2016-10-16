import React from 'react'
import { Redirect, Router, Route } from 'react-router'

import App from './containers/App'
import Home from './containers/Home'
import Users from './containers/Users'
import Teams from './containers/Teams'
import Policies from './containers/Policies'

const validateLogin = (nextState, replace, callback) => {
  // do auth verification here
  callback(/* error */)
}

const Routes = (props) => (
  <Router history={props.history}>
    <Redirect from='/' to='/home' />

    <Route path='/' component={App}>
      <Route path='/home' component={Home} onEnter={validateLogin} />
      <Route path='/users' component={Users} onEnter={validateLogin} />
      <Route path='/teams' component={Teams} onEnter={validateLogin} />
      <Route path='/policies' component={Policies} onEnter={validateLogin} />
    </Route>
  </Router>
)

Routes.propTypes = {
  history: React.PropTypes.object.isRequired
}

export default Routes
