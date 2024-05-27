import { error, ErrorCodes } from "../interpreter/errors.js";

const serverUrl = 'http://localhost:6511'

function buildQuery(url, queryParams) {
  let query = ''
  for (const param in queryParams) {
    const paramVal = (queryParams[param] || '').trim()
    if (paramVal) {
      query += `${query.length === 0 ? '?' : '&'}${param}=${encodeURIComponent(paramVal)}`
    }
  }
  return url + query
}

export default class FileSystem {
  constructor(machine) {
    this.machine = machine

    this.currentFile = null
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

  async getCatalog(path, prefix, suffix) {
    try {
      const url = buildQuery(`${serverUrl}/catalog`, { path, prefix, suffix })
      const response = await window.fetch(url)
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

  setCurrentFile(filename) {
    this.currentFile = filename
  }

  async loadProgram(filename, path = null) {
    if (!filename.endsWith('.bas')) { filename += '.bas' }
    return await this.loadFile(filename, path)
  }

  async setCurrentDirectory(path) {
    try {
      const response = await window.fetch(`${serverUrl}/setdir`, {
        method: 'POST',
        body: JSON.stringify({ path }),
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
      })
      return await response.json()
    } catch (e) {
      console.log('file system error getting catalog')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }

  async scratchFile(filename) {
    try {
      const response = await window.fetch(`${serverUrl}/scratch`, {
        method: 'POST',
        body: JSON.stringify({ filename }),
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
      })
      return await response.json()
    } catch (e) {
      console.log('file system error scratching file')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }
}

