import Statement from './statement.js'
import { ErrorCodes, error } from "../errors.js"

export default class Rem extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'remark*': this.parseRem
    }
    this.interpreterHandlers = {
      'remark*': this.doRem
    }
  }

  parseRem(statement, tokens, lexifier) {
    if (!statement.lineNumber) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    statement.ignoreRestOfLine = true
    return statement // nothing more to do
  }

  doRem(machine, statement, interpreter) {
    return { done: true } // nothing to do
  }
}

