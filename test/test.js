/* global describe it expect */

const fs = require('fs')
const path = require('path')
const cli = require('../lib/cli')

const read = (dir) =>
  fs.readdirSync(dir)
    .reduce((files, file) =>
      fs.statSync(path.join(dir, file)).isDirectory()
        ? files.concat(read(path.join(dir, file)))
        : files.concat(path.join(dir, file)),
      [])

fs.createReadStream(path.join(__dirname, 'build', '_index.html')).pipe(
  fs.createWriteStream(path.join(__dirname, 'build', 'index.html'))
)

describe('react-snapshot', () => {
  describe('cli', () => {
    it('should generate html files', (done) => {
      cli(__dirname).then(() => {
        const files = read(path.join(__dirname, 'build'))
        files.forEach((file) => {
          const html = fs.readFileSync(file, 'utf8')
          expect(html).toMatchSnapshot()
        })
        done()
      })
    })
  })
})
