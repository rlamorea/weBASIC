import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class FileSystem extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'command|CATALOG': this.parseCatalog,
    }
    this.interpreterHandlers = {
      'command|CATALOG' : this.doCatalog
    }
  }

  parseCatalog(statement, tokens, lexifier) {
    // for now do nothing
    // eventually get path?
    return statement
  }

  async doCatalog(machine, statement, interpreter) {
    const catalog = await machine.fileSystem.getCatalog()
    if (catalog.error) { return error }

    machine.currentScreen.displayString('Files Available:')
    for (const file of catalog) {
      machine.currentScreen.displayString('  ' + file)
    }
  }
}
