import { error, ErrorCodes } from "../interpreter/errors.js";

const serverUrl = 'http://localhost:6511'

export default class FileSystem {
  constructor(machine) {
    this.machine = machine

    this.checkServer()
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

  async getCatalog() {
    try {
      const response = await window.fetch(`${serverUrl}/catalog`)
      return await response.json()
    } catch (e) {
      console.log('file system error getting catalog')
      console.error(e)
      return error(ErrorCodes.FILE_ERROR)
    }
  }
}

