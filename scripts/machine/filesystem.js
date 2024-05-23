import { error, ErrorCodes } from "../interpreter/errors.js";

const serverUrl = 'http://localhost:6511'

export default class FileSystem {
  constructor(machine) {
    this.machine = machine

    this.currentFile = null
    this.currentDirectory = '/'
  }

  async checkServer() {
    try {
      const response = await window.fetch(`${serverUrl}/`)
      const result = await response.json()
      console.log('got from server', result)
    } catch (error) {
      console.log('error on checkServer')
      console.error(error)
    }
  }

  async getCatalog(path) {
    try {
      const response = await window.fetch(`${serverUrl}/catalog`)
      return await response.json()
    } catch (e) {
      console.log('file system error getting catalog')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }

  async saveFile(fileContents, filename, path = null) {
    try {
      const response = await window.fetch(`${serverUrl}/save`, {
        method: 'POST',
        body: JSON.stringify({ filename, fileContents }),
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
      })
      return await response.json()
    } catch (e) {
      console.log('file system error saving file')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }

  async saveProgram(codespace, filename, path = null) {
    if (!filename.endsWith('.bas')) { filename += '.bas' }
    let fileLines = []
    for (const lineNumber of codespace.lineNumbers) {
      fileLines.push(codespace.codeLines[lineNumber].text)
    }
    this.currentFile = filename // TODO: path handling
    return await this.saveFile(fileLines.join('\n'), filename, path)
  }

  async loadFile(filename, path = null) {
    try {
      const response = await window.fetch(`${serverUrl}/load?filename=${filename}`)
      return await response.json()
    } catch (e) {
      console.log('file system error loading file')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }

  async loadProgram(filename, path = null) {
    if (!filename.endsWith('.bas')) { filename += '.bas' }
    return await this.loadFile(filename, path)
  }
}

