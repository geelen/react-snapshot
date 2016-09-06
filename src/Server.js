/* Spin up a simple pushstate server */
import pushstate from 'pushstate-server'

export default class Server {
  constructor(baseDir, file, port) {
    this.start = () => {
      return new Promise((resolve, reject) => {
        this.instance = pushstate.start({
          port,
          directories: [baseDir],
          file
        })
        setTimeout(resolve, 1000) /* fuckn node apis how can you tell when a connect server is ready to accept connections when you dont have the internet because you're on a plane fkn */
      })
    }
  }

  stop() {
    console.log("\nServer stopped.")
    this.instance.close()
    process.exit() /* fkn dunno why this doesnt work eh */
  }
}
