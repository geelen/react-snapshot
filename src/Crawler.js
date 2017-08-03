/* Loads a URL then starts looking for links.
 Emits a full page whenever a new link is found. */
import url from 'url'
import path from 'path'
import glob from 'glob-to-regexp'
import Chromy from 'chromy'

export default class Crawler {
  constructor (baseUrl, options) {
    this.baseUrl = baseUrl
    const { protocol, host } = url.parse(baseUrl)
    this.protocol = protocol
    this.host = host
    this.paths = [...options.include]
    this.exclude = options.exclude.map((g) => glob(g, { extended: true, globstar: true }))
    this.processed = {}
    this.chromy = new Chromy({ visible: false })
      .chain()
      .console((text) => console.log(text))
  }

  crawl (handler) {
    this.handler = handler
    console.log(`🕷   Starting crawling ${this.baseUrl}`)
    return this.snap()
      .then(() => {
        console.log(`🕸   Finished crawling.`)
        Chromy.cleanup()
      })
  }

  snap () {
    let urlPath = this.paths.shift()
    if (!urlPath) return Promise.resolve()
    urlPath = url.resolve('/', urlPath) // Resolve removes trailing slashes
    if (this.processed[urlPath]) {
      return this.snap()
    } else {
      this.processed[urlPath] = true
    }

    return this.chromy
      .goto(`${this.protocol}//${this.host}${urlPath}`)
      .evaluate(() => {
        const tagAttributeMap = {
          'a': 'href',
          'iframe': 'src'
        }

        const html = window.document.documentElement.outerHTML

        const urls = Object.keys(tagAttributeMap).reduce((arr, tagName) => {
          const urlAttribute = tagAttributeMap[tagName]
          const elements = document.querySelectorAll(`${tagName}[${urlAttribute}]`)
          const urls = Array.from(elements).map(element => {
            if (element.getAttribute('target') === '_blank') return
            return element.getAttribute(urlAttribute)
          })
          return arr.concat(urls)
        }, [])
        return {
          html,
          urls
        }
      })
      .result((res) => {
        res.urls.forEach(u => {
          const href = url.parse(u)
          if (href.protocol || href.host || href.path === null) return
          const relativePath = url.resolve(urlPath, href.path)
          if (path.extname(relativePath) !== '.html' && path.extname(relativePath) !== '') return
          if (this.processed[relativePath]) return
          if (this.exclude.filter((regex) => regex.test(relativePath)).length > 0) return
          this.paths.push(relativePath)
        })
        this.handler({ urlPath, html: res.html })
      })
      .end()
      .then(() => this.snap())
  }
}
