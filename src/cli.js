import path from 'path'
import fs from 'fs'
import url from 'url'
import Server from './Server'
import Crawler from './Crawler'
import Writer from './Writer'
import Appender from './Appender'
import program from 'safe-commander'

export default () => {
  program
    .version(require('../package.json').version)
    .option('--build-dir <directory>', `Specify where the JS app lives. Defaults to 'build'`)
    .option('--domain <domain>', `The local domain to use for scraping. Defaults to 'localhost'`)
    .option('--output-dir <directory>', `Where to write the snapshots. Defaults to in-place (i.e. same as build-dir)`)
    .option('--sitemap', `Optionally output a sitemap.xml file`)
    .option('--sitemap-domain <domain>', `The domain to use for the sitemap. Defaults to 'http://localhost'`)
    .parse(process.argv)

  const {
    buildDir = 'build',
    domain = 'localhost',
    outputDir = buildDir,
    sitemap = false,
    sitemapDomain = 'http://localhost',
  } = program.optsObj

  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')))
  const basename = ((p) => p.endsWith('/') ? p : p + '/')(pkg.homepage ? url.parse(pkg.homepage).pathname : '')

  const options = Object.assign({
    include: [],
    exclude: [],
    snapshotDelay: 50,
  }, pkg['react-snapshot'] || pkg.reactSnapshot || {})

  options.exclude = options.exclude.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include = options.include.map((p) => path.join(basename, p).replace(/\\/g, '/'))
  options.include.unshift(basename)

  const buildDirPath = path.resolve(`./${buildDir}`)
  const outputDirPath = path.resolve(`./${outputDir}`)
  if (!fs.existsSync(buildDir)) throw new Error(`No build directory exists at: ${buildDirPath}`)
  const writer = new Writer(buildDirPath, outputDirPath)
  writer.move('index.html', '200.html')

  let sitemapWriter = null
  const sitemapFilename = 'sitemap.xml';

  if (sitemap) {
    sitemapWriter = new Appender(buildDirPath, outputDirPath);
    sitemapWriter.write('sitemap.xml', "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
      "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\" \n" +
      "  xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\" \n" +
      "  xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\">");
  }

  const server = new Server(buildDirPath, basename, 0, pkg.proxy)
  server.start().then(() => {
    const crawler = new Crawler(`http://${domain}:${server.port()}${basename}`, options.snapshotDelay, options)
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
        filename = `${urlPath}.html`
      }
      console.log(`✏️   Saving ${urlPath} as ${filename}`)

      if (sitemap) {
        console.log(`📝  Writing ${sitemapDomain}${urlPath} to ${sitemapFilename}`);
        sitemapWriter.write(sitemapFilename, `<url><loc>${sitemapDomain}${urlPath}</loc></url>`);
      }
      writer.write(filename, html)
    })

  }).then(() => {
    if (sitemap) {
      console.log(`✅  Finished ${sitemapFilename}`);
      sitemapWriter.write(sitemapFilename, '</urlset>')
    }
    server.stop()
  }, err => console.log(`🔥 ${err}`))
}
