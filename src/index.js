import React from 'react'
import ReactDOM from 'react-dom'

export const IS_REACT_SNAPSHOT = navigator.userAgent.match(/Node\.js/i) && window && window.react_snapshot_render

const state = {
  requests: [],
  data: window.react_snapshot_state || {},
}
let count = 0

export const render = (rootComponent, domElement) => {
  ReactDOM.render(rootComponent, domElement)
  if (IS_REACT_SNAPSHOT) {
    window.react_snapshot_render(domElement, state)
  }
}

export const snapshot = func => {
  const i = count++
  const existing = state.data[i]
  if (existing) {
    const { success, failure } = existing
    /* This mimics a Promise API but is entirely synchronous */
    return {
      then(resolve, reject) {
        if (typeof success !== 'undefined') resolve(success)
        else if (reject && typeof failure !== 'undefined') reject(failure)
      },
      catch(reject) {
        if (typeof failure !== 'undefined') reject(success)
      }
    }
  } else {
    if (!IS_REACT_SNAPSHOT) return func()
    const promise = func().then(
      success => {
        state.data[i] = { success }
        return success
      },
      failure => {
        state.data[i] = { failure }
        return Promise.reject(failure)
      }
    )
    state.requests.push(promise)
    return promise
  }
}

export const Snapshot = (prop_defs) => {
  const prop_names = Object.keys(prop_defs)
  if (typeof prop_defs !== "object" ||
    prop_names.some(k => typeof prop_defs[k] !== 'function')
  ) throw new Error("Snapshot requires an object of type { propName: () => Promise }.")
  console.log(prop_defs)

  const hoc = (Component, render_without_data) => {
    class SnapshotComponent extends React.Component {
      constructor() {
        super()
        this.state = { loaded_all: false, async_props: null }
      }

      componentWillMount() {
        snapshot(() =>
          Promise.all(prop_names.map(prop_name => prop_defs[prop_name](this.props)))
        ).then(responses => {
          const new_state = {}
          prop_names.forEach((prop_name, i) => new_state[prop_name] = responses[i])
          this.setState({ async_props: new_state, loaded_all: true })
        })
      }

      render() {
        if (!this.state.loaded_all && !render_without_data) return null
        const props = Object.assign({},
          this.props,
          this.state.async_props
        )
        return React.createElement(Component, props)
      }
    }
    SnapshotComponent.displayName = `Snapshot(${Component.displayName || Component.name})`
    return SnapshotComponent
  }
  return {
    thenRender: Component => hoc(Component, false),
    rendering: Component => hoc(Component, true)
  }
}
