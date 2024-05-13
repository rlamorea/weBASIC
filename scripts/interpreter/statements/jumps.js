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

export default class Jumps extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|GOTO': this.parseGotoGosub,
      'statement|GOSUB': this.parseGotoGosub,
      'statement|RETURN': this.parseReturn
    }
    this.interpreterHandlers = {
      'statement|GOTO': this.doGoto,
      'statement|GOSUB': this.doGosub,
      'statement|RETURN': this.doReturn
    }
  }

  parseGotoGosub(statement, tokens, lexifier) {
    // TODO: eventually this will take a labels as well as line numbers
    if (tokens.length > 0) {
      const goLine = tokens.shift()
      if (goLine.coding !== 'number-literal') {
        return error(ErrorCodes.UNKNOWN_LINE, goLine.tokenStart, goLine.tokenEnd)
      }
      const goLineNumber = parseInt(goLine.token)
      if (isNaN(goLineNumber) || !isFinite(goLineNumber)) {
        return error(ErrorCodes.UNKNOWN_LINE, goLine.tokenStart, goLine.tokenEnd)
      }
      statement.goLine = goLineNumber
    }
    if (tokens.length > 0) {
      return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd)
    }
    return statement
  }

  parseReturn(statement, tokens, lexifier) {
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd) }
    return statement
  }

  doGoto(machine, statement, interpreter) {
    return { done: true, redirectLine: statement.goLine }
  }

  doGosub(machine, statement, interpreter) {
    machine.runCodespace.gosubStack.push({
      lineIndex: machine.runCodespace.lineNumberIndex,
      statementIndex: machine.runCodespace.currentStatementIndex,
      codeLine: machine.runCodespace.codeLine
    })
    return { done: true, redirectLine: statement.goLine }
  }

  doReturn(machine, statement, interpreter) {
    if (machine.runCodespace.gosubStack.length === 0) {
      return error(ErrorCodes.UNEXPECTED_RETURN, statement.tokenStart, statement.tokenEnd)
    }
    const returnState = machine.runCodespace.gosubStack.pop()
    machine.runCodespace.lineNumberIndex = returnState.lineIndex
    machine.runCodespace.currentStatementIndex = returnState.statementIndex
    machine.runCodespace.codeLine = returnState.codeLine
    return { done: true }
  }
}
