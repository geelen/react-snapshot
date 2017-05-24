import ReactDOM from 'react-dom';

const state = {
  requests: [],
  data: window.react_snapshot_state || {},
}
let count = 0

export const render = (rootComponent, domElement) => {
  ReactDOM.render(rootComponent, domElement)
  if (navigator.userAgent.match(/Node\.js/i) && window && window.react_snapshot_render) {
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
    const promise = func().then((...response) => new Promise(resolve => {
      state.data[i] = response
      resolve(...response)
    }))
    state.requests.push(promise)
    return promise
  }
}
