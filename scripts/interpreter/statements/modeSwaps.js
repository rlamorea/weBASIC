import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

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
      'command|LIVE': this.doLive,
    }
  }

  parseEditList(statement, tokens, lexifier) {
    // TODO: temporary, eventually this will take a line number
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    return statement
  }

  parseLive(statement, tokens, lexifier) {
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    return statement
  }

  doEditList(machine, statement, interpreter) {
    machine.activateMode('EDIT')
    return { done: true }
  }

  doLive(machine, statement, interpreter) {
    machine.activateMode('LIVE')
    return { done: true, preserveListener: true }
  }
}
