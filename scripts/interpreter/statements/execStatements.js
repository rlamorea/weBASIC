import Statement from './statement.js'
import { ErrorCodes, error, errorat } from '../errors.js'

async function goRunCont(machine, statement, startMode) {
  const method = statement.token
  if (method === 'RUN') {
    machine.variables.clearAll()
    machine.execution.prepCodespaceForRun(machine.runCodespace)
    machine.currentScreen.clearViewport()
  }
  machine.runCodespace.startMode = startMode
  const runLine = statement.startLine === undefined ? -1 : statement.startLine
  if (runLine >= 0 && method === 'CONT') {
    machine.runCodespace.currentStatementIndex = 0
  }
  const result = await machine.execution.runCode(machine.runCodespace, runLine)
  if (!result.newMode) {
    result.newMode = (result.error) ? 'LIVE' : startMode
  }
  machine.activateMode(result.newMode)
  if (result.prepNewMode) { await result.prepNewMode() }
  if (result.error) { machine.currentScreen.displayError(result.error) }
}

export default class ExecStatements extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'command|RUN': this.parseRunCont,
      'command|CONT': this.parseRunCont,
      'statement|END': this.parseEndStop,
      'statement|STOP': this.parseEndStop,
    }
    this.interpreterHandlers = {
      'command|RUN': this.doRunCont,
      'command|CONT': this.doRunCont,
      'statement|END': this.doEnd,
      'statement|STOP': this.doStop
    }
  }

  parseRunCont(statement, tokens, lexifier) {
    // TODO: eventually this will take a labels as well as line numbers
    if (tokens.length > 0) {
      const startLine = tokens.shift()
      if (startLine.coding !== 'number-literal') {
        return error(ErrorCodes.UNKNOWN_LINE, startLine.tokenStart, startLine.tokenEnd)
      }
      const startLineNumber = parseInt(startLine.token)
      if (isNaN(startLineNumber) || !isFinite(startLineNumber)) {
        return error(ErrorCodes.UNKNOWN_LINE, startLine.tokenStart, startLine.tokenEnd)
      }
      statement.startLine = startLineNumber
    }
    // NOTE: anything further is ignored!
    return statement
  }

  parseEndStop(statement, tokens, lexifier) {
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd) }
    return statement
  }

  doRunCont(machine, statement, interpreter) {
    if (machine.currentMode === 'RUN') {
      return error(ErrorCodes.ILLEGAL_COMMAND, statement.tokenStart, statement.tokenEnd)
    }
    const startMode = machine.currentMode
    return { done: true, newMode: 'RUN', prepNewMode: () => { goRunCont(machine, statement, startMode) } }
  }

  async doEnd(machine, statement, interpreter) {
    if (machine.currentMode !== 'RUN') {
      return error(ErrorCodes.NOT_ALLOWED, statement.tokenStart, statement.tokenEnd)
    }
    return {
      done: true,
      stopExecution: 'end',
      newMode: machine.runCodespace.startMode
    }
  }

  doStop(machine, statement, interpreter) {
    if (machine.currentMode !== 'RUN') {
      return error(ErrorCodes.NOT_ALLOWED, statement.tokenStart, statement.tokenEnd)
    }
    const errorMessage = `${ErrorCodes.BREAK} in line ${machine.runCodespace.currentLineNumber}`
    machine.runCodespace.codeLine = null
    machine.runCodespace.currentStatementIndex += 1 // step past the STOP statement
    return {
      done: true,
      stopExecution: 'break',
      newMode: 'LIVE'
    }
  }
}
