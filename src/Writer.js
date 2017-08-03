/* Simple wrapper around fs so I can concentrate on what's going on */
import fs from 'fs'
import path from 'path'
import { sync as mkDirPSync } from 'mkdirp'

export default class Writer {
  constructor (baseDir) {
    this.baseDir = baseDir
  }

  move (from, to) {
    /* Only do this if we still have an index.html
    (i.e. this is the first run post build) */
    const fromPath = path.resolve(this.baseDir, from)
    if (fs.existsSync(fromPath)) {
      fs.renameSync(fromPath, path.resolve(this.baseDir, to))
    }
  }

  write (filename, content) {
    const newPath = path.join(this.baseDir, filename)
    const dirName = path.dirname(newPath)
    mkDirPSync(dirName)
    fs.writeFileSync(newPath, content)
  }
}
