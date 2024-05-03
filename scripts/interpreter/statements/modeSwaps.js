import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

function goEdit(machine, statement) {
  machine.currentScreen.setMode('edit')
  machine.currentScreen.showLines(statement.startLine, statement.endLine)
}

export default class ModeSwaps extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'command|EDIT': this.parseEditList,
      'command|LIST': this.parseEditList,
      'command|LIVE': this.parseLive,
    }
    this.interpreterHandlers = {
      'command|EDIT': this.doEditList,
      'command|LIST': this.doEditList,
      'command|LIVE': this.doLive,
    }
  }

  parseEditList(statement, tokens, lexifier) {
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
    if (tokens.length > 0) {
      const minus = tokens.shift()
      if (minus.coding !== 'minus') { return error(ErrorCodes.SYNTAX, minus.tokenStart, minus.tokenEnd) }
    }
    if (tokens.length > 0) {
      const endLine = tokens.shift()
      if (endLine.coding !== 'number-literal') {
        return error(ErrorCodes.UNKNOWN_LINE, endLine.tokenStart, endLine.tokenEnd)
      }
      const endLineNumber = parseInt(endLine.token)
      if (isNaN(endLineNumber) || !isFinite(endLineNumber)) {
        return error(ErrorCodes.UNKNOWN_LINE, endLine.tokenStart, endLine.tokenEnd)
      }
      statement.endLine = endLineNumber
    }
    // NOTE: anything further is ignored!
    return statement
  }

  parseLive(statement, tokens, lexifier) {
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    return statement
  }

  doEditList(machine, statement, interpreter) {
    let newMode = null
    let prepNewMode = null
    if (machine.currentMode !== 'EDIT') {
      newMode = 'EDIT'
      prepNewMode = () => { goEdit(machine, statement) }
    }
    return { done: true, newMode, prepNewMode }
  }

  doLive(machine, statement, interpreter) {
    let newMode = null
    if (machine.currentMode !== 'LIVE') {
      newMode = 'LIVE'
    }
    return { done: true, newMode }
  }
}
