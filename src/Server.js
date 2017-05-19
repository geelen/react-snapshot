/* Spin up a simple express server */
import express from 'express'
import httpProxyMiddleware from 'http-proxy-middleware'
import historyApiFallback from 'connect-history-api-fallback'

export default class Server {
  constructor(baseDir, publicPath, port, proxy) {
    const app = express()

    // Yes I just copied most of this from react-scripts ¯\_(ツ)_/¯
    app.use(historyApiFallback({
      index: '/200.html',
      disableDotRule: true,
      htmlAcceptHeaders: proxy ? ['text/html'] : ['text/html', '*/*'],
    }))
    app.use(publicPath, express.static(baseDir, { index: '200.html' }))
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

  stop() {
    console.log("\nServer stopped.")
    this.instance.close()
    process.exit() /* fkn dunno why this doesnt work eh */
  }
}
