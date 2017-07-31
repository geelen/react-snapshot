/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'
//import * as ReactMarkupChecksum from 'react-dom/lib/ReactMarkupChecksum'
//import escapeTextContentForBrowser from 'react-dom/lib/escapeTextContentForBrowser'
//import adler32 from 'react-dom/lib/adler32'
//const TEXT_NODE = 3
import ReactDOMServer from 'react-dom/server'

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
        window.react_snapshot_render = (element, state, rootComponent) => {
          render_called = { element, state, rootComponent }
        }
      },
      done: (err, window) => {
        if (!render_called) {
          return reject("'render' from react-snapshot was never called. Did you replace the call to ReactDOM.render()?")
        }

        const { element, state, rootComponent } = render_called

        const next = () => {
          const shift = state.requests.shift()
          return shift && shift.then(next)
        }
        /* Wait a short while, then wait for all requests, then serialise */
        new Promise(res => setTimeout(res, delay))
          .then(next)
          .then(() => {
            // This approach is really difficult to get working reliably

            //Array.from(element.querySelectorAll('*')).forEach(el => {
            //  const instance_key = Object.keys(el).find(k => k.startsWith('__reactInternalInstance'))
            //  if (instance_key) el.setAttribute('data-reactid', el[instance_key]._domID)
            //  if (el.hasChildNodes()) {
            //    for (let i = 0; i < el.childNodes.length; i++) {
            //      const tn = el.childNodes[i]
            //      if (tn.nodeType === TEXT_NODE) tn.data = escapeTextContentForBrowser(tn.textContent)
            //    }
            //  }
            //})
            //

            //const markup = element.innerHTML
            //console.log(adler32(markup))
            //console.log(markup)
            //element.innerHTML = ReactMarkupChecksum.addChecksumToMarkup(markup)

            // This approach is much more reliable but is it too confusing??
            state.count = 0
            element.innerHTML = ReactDOMServer.renderToString(rootComponent)

            window.document.body.insertAdjacentHTML('afterBegin', `
              <script>window.react_snapshot_state = ${JSON.stringify(state.data)};</script>
            `)
            resolve(window)
          })
      }
    })
  })
}
