const fs = require('fs-extra')
const path = require('path')

class Db {
  constructor (filePath, defaultData) {
    this.filePath = filePath
    this.defaultData = defaultData
  }

  rename (newPath) {
    if (fs.existsSync(this.filePath) && !fs.existsSync(newPath)) {
      fs.ensureDirSync(path.dirname(newPath))
      fs.renameSync(this.filePath, newPath)
    }

    this.filePath = newPath
  }

  read (prototype) {
    if (!fs.existsSync(this.filePath)) return this.defaultData

    var fileContent = fs.readFileSync(this.filePath)
    if (fileContent.length == 0) return this.defaultData

    return (prototype) ? prototype.fromJson(JSON.parse(fileContent)) : JSON.parse(fileContent)
  }

  write (data) {
    fs.ensureDirSync(path.dirname(this.filePath))
    fs.writeFileSync(this.filePath, JSON.stringify(data))
  }
}

module.exports = Db
