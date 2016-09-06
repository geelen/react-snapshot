import path from 'path'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'

export default () => {
  const baseDir = path.resolve('./build')
  const writer = new Writer(baseDir)
  writer.move('index.html', '200.html')

  const server = new Server(baseDir, '/200.html', 2999)
  server.start().then(() => {

    const crawler = new Crawler("http://localhost:2999")
    return crawler.crawl(({ path, html }) => {
      const filename = `${path}${path.endsWith('/') ? 'index' : ''}.html`
      console.log(`✏️   Saving ${path} as ${filename}`)
      writer.write(filename, html)
    })

  }).then(() => server.stop(), err => console.log(err))
}
