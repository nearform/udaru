import React from 'react'
import { Redirect, Router, Route } from 'react-router'

import App from './containers/App'
import Home from './components/Home'

const validateLogin = (nextState, replace, callback) => {
  // do auth verification here
  callback(/* error */)
}

const Routes = (props) => (
  <Router history={props.history}>
    <Redirect from="/" to="/home" />

    <Route path="/" component={App}>
      <Route path="/home" component={Home} onEnter={validateLogin} />
    </Route>
  </Router>
)

Routes.propTypes = {
  history: React.PropTypes.object.isRequired
}

export default Routes
