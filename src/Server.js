/* Spin up a simple express server */
import express from 'express'
import httpProxyMiddleware from 'http-proxy-middleware'
import historyApiFallback from 'connect-history-api-fallback'

export default class Server {
  constructor(baseDir, publicPath, port, proxy) {
    const app = express()

    app.get('*', (req, res, next) => {
      // This makes sure the sockets close down so that
      // we can gracefully shutdown the server
      res.set('Connection', 'close');
      next()
    })

    // Yes I just copied most of this from react-scripts ¯\_(ツ)_/¯
    app.use(publicPath,
      historyApiFallback({
        index: '/200.html',
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html'],
      }),
      express.static(baseDir, { index: '200.html' })
    )

    if (proxy) {
      if (typeof proxy !== "string") throw new Error("Only string proxies are implemented currently.")
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
