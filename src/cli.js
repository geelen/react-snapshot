import path from 'path'
import fs from 'fs'
import url from 'url'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'

export default (basePath = process.cwd()) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(basePath, 'package.json')))
  const basename = ((p) => p.endsWith('/') ? p : p + '/')(pkg.homepage ? url.parse(pkg.homepage).pathname : '')

  const options = Object.assign({
    include: [],
    exclude: []
  }, pkg.reactSnapshot || {})

  options.exclude = options.exclude.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include = options.include.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include.unshift(basename)

  const buildDir = path.resolve(basePath, './build')

  const writer = new Writer(buildDir)
  writer.move('index.html', '200.html')

  const server = new Server(buildDir, basename, 0, pkg.proxy)
  return server.start().then(() => {
    const crawler = new Crawler(`http://localhost:${server.port()}${basename}`, options)
    return crawler.crawl(({ urlPath, html }) => {
      if (!urlPath.startsWith(basename)) {
        console.log(`❗ Refusing to crawl ${urlPath} because it is outside of the ${basename} sub-folder`)
        return
      }
      urlPath = urlPath.replace(basename, '/')
      let filename = urlPath
      if (urlPath.endsWith('/')) {
        filename = `${urlPath}index.html`
      } else if (path.extname(urlPath) === '') {
        filename = `${urlPath}.html`
      }
      console.log(`✏️   Saving ${urlPath} as ${filename}`)
      writer.write(filename, html)
    })
  }).then(() => server.stop(), err => console.log(`🔥 ${err}`))
}
