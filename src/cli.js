import path from 'path'
import fs from 'fs'
import url from 'url'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'

export default () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  const basename = ((p) => p.endsWith('/') ? p : p + '/')(pkg.homepage ? url.parse(pkg.homepage).pathname : '')
  const saveAsIndexHtml = process.argv.length > 2 && (process.argv[2] === '--save-as-index-html')

  const options = Object.assign({
    include: [],
    exclude: [],
    snapshotDelay: 50
  }, pkg.reactSnapshot || {})

  options.exclude = options.exclude.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include = options.include.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include.unshift(basename)

  const buildDir = path.resolve('./build')
  const writer = new Writer(buildDir)
  writer.move('index.html', '200.html')

  const server = new Server(buildDir, basename, 0, pkg.proxy)
  server.start().then(() => {
    const crawler = new Crawler(`http://localhost:${server.port()}${basename}`, options.snapshotDelay, options)
    return crawler.crawl(({ urlPath, html }) => {
      if (!urlPath.startsWith(basename)) {
        console.log(`❗ Refusing to crawl ${urlPath} because it is outside of the ${basename} sub-folder`)
        return
      }
      urlPath = urlPath.replace(basename, '/')
      let filename = urlPath
      if (urlPath.endsWith('/')) {
        filename = `${urlPath}index.html`
      } else if (path.extname(urlPath) == '') {
        if (saveAsIndexHtml) {
          filename = `${urlPath}/index.html`
        } else {
          filename = `${urlPath}.html`
        }
      }
      console.log(`✏️   Saving ${urlPath} as ${filename}`)
      writer.write(filename, html)
    })

  }).then(() => server.stop(), err => console.log(`🔥 ${err}`))
}
