import React, { Component } from 'react'

// Exporting Component, it can be imported and dropped into any container to render
export class HelloWorld extends Component {
  constructor (props) {
    super(props)

    this.action1 = ::this.action1
    this.action2 = ::this.action2
  }

  action1 () {
    window.fetch('/service1/action1')
      .then((response) => response.json())
      .then((data) => {
        window.alert('Response from service1 action1')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  action2 () {
    window.fetch('/service1/action2')
      .then((response) => response.json())
      .then((data) => {
        window.alert('Response from service1 action2')
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render () {
    return (
      <div>
        <button type="button" onClick={this.action1}>Call Service1 Action1</button>
        <br />
        <button type="button" onClick={this.action2}>Call Service1 Action2</button>
      </div>
    )
  }
}

// Exposing Route, it can directly be imported and plugged into react-router
export class HelloWorldRoute extends Component {
  static defaultProps = {
    path: '/hello-world',
    component: HelloWorld,
    onEnter: (/* nextState, replace, callback */) => {
      // Route enter hook
    }
  }
}
