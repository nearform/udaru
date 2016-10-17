import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { compose, createStore, combineReducers, applyMiddleware } from 'redux'
import { reducer as formReducer } from 'redux-form'
import thunk from 'redux-thunk'
import { browserHistory } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin'

import Routes from './Routes'

// import normalize.css
// It's an npm package and omitted by default config
// hence, we're manually invoking the loaders with `style!css!`
import 'style!css!normalize.css'

import 'muicss/lib/sass/mui.scss'
import './styles/main.scss'

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

import reducers from './reducers'

const rootReducer = combineReducers({
  ...reducers,
  form: formReducer
})

const middleware = applyMiddleware(
  thunk
)

const store = createStore(
  rootReducer,
  compose(
    middleware,
    window.devToolsExtension ? window.devToolsExtension() : f => f
  )
)

render(
  <Provider store={store}>
    <Routes history={browserHistory} />
  </Provider>,
  document.getElementById('app')
)
