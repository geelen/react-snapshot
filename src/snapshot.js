/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'

export default (protocol, host, path) => {
  console.log({host, path})
  return new Promise((resolve, reject) => {
    jsdom.env({
      url: `${protocol}//${host}${path}`,
      resourceLoader(resource, callback) {
        if (resource.url.host === host) {
          console.log(`YEP ${resource.url.href}`)
          resource.defaultFetch(callback);
        } else {
          console.log(`NOPE ${resource.url.href}`)
          callback()
        }
      },
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },
      virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      done: (err, window) => {
        if (err) reject(err)
        resolve(window.document.documentElement.outerHTML)
      }
    })
  })
}
