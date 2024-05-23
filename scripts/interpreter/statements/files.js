import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class Files extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'command|CATALOG': this.parseCatalog,
      'command|SAVE': this.parseLoadSave,
      'command|LOAD': this.parseLoadSave,
    }
    this.interpreterHandlers = {
      'command|CATALOG' : this.doCatalog,
      'command|SAVE': this.doSave,
      'command|LOAD': this.doLoad,
    }
  }

  parseCatalog(statement, tokens, lexifier) {
    // for now do nothing
    // eventually get path?
    return statement
  }

  parseLoadSave(statement, tokens, lexifier) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    const fileName = tokens.shift()
    if (fileName.coding !== 'string-literal') {
      return Error(ErrorCodes.SYNTAX, fileName.tokenStart, fileName.tokenEnd)
    }
    statement.fileName = fileName.token
    return statement
  }

  async doCatalog(machine, statement, interpreter) {
    const catalog = await machine.fileSystem.getCatalog()
    if (catalog.error) { return error }

    machine.currentScreen.displayString('Files Available:')
    for (const file of catalog) {
      machine.currentScreen.displayString('  ' + file)
    }
    return { done: true }
  }

  async doSave(machine, statement, interpreter) {
    if (machine.runCodespace.lineNumbers.length === 0) {
      return error(ErrorCodes.NO_PROGRAM)
    }
    const result = await machine.fileSystem.saveProgram(machine.runCodespace, statement.fileName)
    if (result.error) { return error }
    machine.currentScreen.displayMessage(`File Saved`)
    return { done: true }
  }

  async doLoad(machine, statement, interpreter) {
    const result = await machine.fileSystem.loadProgram(statement.fileName)
    if (result.error) { return error }
    machine.execution.resetCodespaceToNew(machine.runCodespace)
    const lines = result.fileContents.split('\n')
    if (lines[lines.length - 1].trim() === '') { lines.pop() }
    for (const line of lines) {
      machine.execution.addCodeLine(machine.runCodespace, -1, line)
    }
    machine.currentScreen.displayMessage(`${lines.length} BASIC lines loaded`)
    machine.screens['EDIT'].resetEditor()
    return { done: true }
  }
}
