/* Spin up a simple express server */
import express from 'express'
import httpProxyMiddleware from 'http-proxy-middleware'
import path from 'path'

export default class Server {
  constructor(baseDir, publicPath, port, proxy) {
    const app = express()

    app.get('*', (req, res, next) => {
      // This makes sure the sockets close down so that
      // we can gracefully shutdown the server
      res.set('Connection', 'close');
      next()
    })

    app.use(publicPath, express.static(baseDir))

    // Serve 200.html instead of 404 for react routing
    app.use(publicPath, (req, res, next) => {
      if(proxy && !req.accepts('text/html')) {
        next()
      }
      res.sendFile(path.join(baseDir, '200.html'))
    })

    if (proxy) {
      app.use(httpProxyMiddleware({
        target: proxy,
        onProxyReq: proxyReq => {
          if (proxyReq.getHeader('origin')) proxyReq.setHeader('origin', proxy)
        },
        changeOrigin: true,
        xfwd: true,
      }))
    }

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
