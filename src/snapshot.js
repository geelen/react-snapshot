/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'
import * as ReactMarkupChecksum from 'react-dom/lib/ReactMarkupChecksum'

export default (protocol, host, path, delay) => {
  return new Promise((resolve, reject) => {
    let render_called = false
    jsdom.env({
      url: `${protocol}//${host}${path}`,
      headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" },
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
        window.react_snapshot_render = (element, state) => {
          render_called = { element, state }
        }
      },
      done: (err, window) => {
        if (!render_called) {
          return reject("'render' from react-snapshot was never called. Did you replace the call to ReactDOM.render()?")
        }

        const { element, state } = render_called

        const next = () => {
          const shift = state.requests.shift()
          return shift && shift.then(next)
        }
        /* Wait a short while, then wait for all requests, then serialise */
        new Promise(res => setTimeout(res, delay))
          .then(next)
          .then(() => {
            console.log(state.data)
            element.outerHTML = ReactMarkupChecksum.addChecksumToMarkup(element.outerHTML)
            window.document.body.insertAdjacentHTML('afterBegin', `
              <script>window.react_snapshot_state = ${JSON.stringify(state.data)};</script>
            `)
            resolve(window)
          })
      }
    })
  })
}
