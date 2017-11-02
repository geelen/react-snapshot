/* Loads a URL then starts looking for links.
 Emits a full page whenever a new link is found. */
import url from 'url'
import path from 'path'
import jsdom from 'jsdom'
import glob from 'glob-to-regexp'
import snapshot from './snapshot'

export default class Crawler {
  constructor(baseUrl, snapshotDelay, options) {
    this.baseUrl = baseUrl
    const { protocol, host } = url.parse(baseUrl)
    this.protocol = protocol
    this.host = host
    this.paths = [...options.include]
    this.exclude = options.exclude.map((g) => glob(g, { extended: true, globstar: true}))
    this.stripJS = options.stripJS
    this.processed = {}
    this.snapshotDelay = snapshotDelay
  }

  crawl(handler) {
    this.handler = handler
    console.log(`🕷   Starting crawling ${this.baseUrl}`)
    return this.snap()
      .then(() => console.log(`🕸   Finished crawling.`))
  }

  snap() {
    let urlPath = this.paths.shift()
    if (!urlPath) return Promise.resolve()
    urlPath = url.resolve('/', urlPath) // Resolve removes trailing slashes
    if (this.processed[urlPath]) {
      return this.snap()
    } else {
      this.processed[urlPath] = true
    }
    return snapshot(this.protocol, this.host, urlPath, this.snapshotDelay).then(window => {
      if (this.stripJS) {
        const strip = new RegExp(this.stripJS)
        Array.from(window.document.querySelectorAll('script')).forEach(script => {
          if (strip.exec(url.parse(script.src).path)) script.remove()
        })
      }
      if (Boolean(window.react_snapshot_state)) {
        const stateJSON = JSON.stringify(window.react_snapshot_state)
        const script = window.document.createElement('script')
        script.innerHTML = `window.react_snapshot_state = JSON.parse('${stateJSON}');`
        window.document.head.appendChild(script)
      }
      const html = jsdom.serializeDocument(window.document)
      this.extractNewLinks(window, urlPath)
      this.handler({ urlPath, html })
      window.close() // Release resources used by jsdom
      return this.snap()
    }, err => {
      console.log(`🔥 ${err}`)
    })
  }

  extractNewLinks(window, currentPath) {
    const document = window.document
    const tagAttributeMap = {
      'a': 'href',
      'iframe': 'src'
    }

    Object.keys(tagAttributeMap).forEach(tagName => {
      const urlAttribute = tagAttributeMap[tagName]
      Array.from(document.querySelectorAll(`${tagName}[${urlAttribute}]`)).forEach(element => {
        if (element.getAttribute('target') === '_blank') return
        const href = url.parse(element.getAttribute(urlAttribute))
        if (href.protocol || href.host || href.path === null) return;
        const relativePath = url.resolve(currentPath, href.path)
        if (path.extname(relativePath) !== '.html' && path.extname(relativePath) !== '') return;
        if (this.processed[relativePath]) return;
        if (this.exclude.filter((regex) => regex.test(relativePath)).length > 0) return
        this.paths.push(relativePath)
      })
    })
  }
}
