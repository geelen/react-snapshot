import ReactDOM from 'react-dom';

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

export const async = func => {
  const i = count++
  const existing = state.data[i]
  if (existing) {
    console.log("SHORT CIRCUIT!")
    return { then: x => x(...existing) }
  } else {
    if (!IS_REACT_SNAPSHOT) return func()
    const promise = func().then((...response) => new Promise(resolve => {
      state.data[i] = response
      resolve(...response)
    }))
    state.requests.push(promise)
    return promise
  }
}
