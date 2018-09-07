
import fs from 'fs'
import Writer from './Writer'

export default class Appender extends Writer {
  constructor(baseDir, outputDir) {
    super(baseDir, outputDir)
    this.writer = fs.appendFileSync
  }
}
