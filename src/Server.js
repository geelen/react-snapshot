/* Spin up a simple express server */
import express from 'express'

export default class Server {
  constructor(baseDir, publicPath, port) {
    const app = express()

    app.use(publicPath, express.static(baseDir, { index: '200.html' }))

    this.start = this.start.bind(this, app, port)
  }

  start(app, port) {
    return new Promise((resolve, reject) => {
      this.instance = app.listen(port, (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  }

  stop() {
    console.log("\nServer stopped.")
    this.instance.close()
    process.exit() /* fkn dunno why this doesnt work eh */
  }
}
