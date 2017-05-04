/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'

export default (protocol, host, path) => {
  return new Promise((resolve, reject) => {
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
      done: (err, window) => {
        if (err) reject(err)
        setTimeout(() => resolve(window), 1000)
      }
    })
  })
}
