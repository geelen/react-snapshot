/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'

export default (protocol, host, path, delay) => {
  return new Promise((resolve, reject) => {
    var reactSnapshotRenderCalled = false
    jsdom.env({
      url: `${protocol}//${host}${path}`,
      resourceLoader(resource, callback) {
        if (resource.url.host === host) {
          resource.defaultFetch(callback);
        } else {
          callback()
        }
      },
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },
      virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      created: (err, window) => {
        if (err) reject(err)
        window.reactSnapshotRender = () => {
          reactSnapshotRenderCalled = true
          setTimeout(() => {
            resolve(window)
          }, delay)
        }
      },
      done: (err, window) => {
        if (!reactSnapshotRenderCalled) {
          reject("'render' from react-snapshot was never called. Did you replace the call to ReactDOM.render()?")
        }
      }
    })
  })
}
