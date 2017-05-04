import path from 'path'
import fs from 'fs'
import url from 'url'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
const publicPath = pkg.homepage ? url.parse(pkg.homepage).pathname : '/'

export default () => {
  const baseDir = path.resolve('./build')
  const writer = new Writer(baseDir)
  writer.move('index.html', '200.html')

  const server = new Server(baseDir, publicPath, 2999, pkg.proxy)
  server.start().then(() => {
    const crawler = new Crawler(`http://localhost:2999${publicPath}`)
    return crawler.crawl(({ path, html }) => {
      const filename = path === publicPath ?
        'index.html' :
        `${path}${path.endsWith('/') ? 'index' : ''}.html`
      console.log(`✏️   Saving ${path} as ${filename}`)
      writer.write(filename, html)
    })

  }).then(() => server.stop(), err => console.log(err))
}
