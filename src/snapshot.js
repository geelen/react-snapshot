/* Wraps a jsdom call and returns the full page */

import jsdom from "jsdom"
import { renderToString } from "react-dom/server"

export default (protocol, host, path, delay) => {
  return new Promise((resolve, reject) => {
    let reactSnapshotRenderCalled = false
    const url = `${protocol}//${host}${path}`
    jsdom.env({
      url,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "User-Agent": "ReactSnapshot"
      },
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
        if (err) return reject(err)
        if (!window) return reject(`Looks like no page exists at ${url}`)
        window.reactSnapshotRender = (rootComponent) => {
          reactSnapshotRenderCalled = true;
          setTimeout(() => {
            resolve(window)
          }, delay)
          return renderToString(rootComponent);
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
