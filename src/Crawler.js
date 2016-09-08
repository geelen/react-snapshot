/* Loads a URL then starts looking for links.
  Emits a full page whenever a new link is found. */
import url from 'url'
import snapshot from './snapshot'
import jsdom from 'jsdom'

export default class Crawler {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    const { protocol, host, path } = url.parse(baseUrl)
    this.protocol = protocol
    this.host = host
    this.paths = [path]
    this.processed = {}
  }

  crawl(handler) {
    this.handler = handler
    console.log(`🕷   Starting crawling ${this.baseUrl}`)
    return this.snap()
      .then(() => console.log(`🕸   Finished crawling.`))
  }

  snap() {
    let path = this.paths.shift()
    if (!path) return Promise.resolve()
    if (this.processed[path]) {
      return this.snap()
    } else {
      this.processed[path] = true
    }
    return snapshot(this.protocol, this.host, path).then(window => {
      const html = jsdom.serializeDocument(window.document)
      this.extractNewLinks(window, path)
      this.handler({ path, html })
      return this.snap()
    }, err => {
      console.log(err)
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
        const { protocol, host, path } = url.parse(element.getAttribute(urlAttribute))
        if (protocol || host) return
        const relativePath = url.resolve(currentPath, path)
        if (!this.processed[relativePath]) this.paths.push(relativePath)
      })
    })
  }
}
