/* Spin up a simple express server */
import express from 'express'
import path from 'path'

export default class Server {
  constructor(baseDir, publicPath, port) {
    const app = express()

    app.get('*', (req, res, next) => {
      // This makes sure the sockets close down so that
      // we can gracefully shutdown the server
      res.set('Connection', 'close');
      next()
    })

    app.use(publicPath, express.static(baseDir))

    app.get('*', (req, res) => {
      res.sendFile(path.join(baseDir, '200.html'))
    });
  
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

  port() {
    return this.instance.address().port
  }

  stop() {
    this.instance.close()
  }
}
