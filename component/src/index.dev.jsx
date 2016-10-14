import React from 'react'
import { render } from 'react-dom'
import { browserHistory } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin'

import Routes from './Routes'

// import normalize.css
// It's an npm package and omitted by default config
// hence, we're manually invoking the loaders with `style!css!`
import 'style!css!normalize.css';

import 'muicss/lib/sass/mui.scss'
import './styles/main.scss'

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin()

render(
  <Routes history={browserHistory} />,
  document.getElementById('app')
)
