import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class Assignment extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|LET': this.parseLet
    }
    this.interpreterHandlers = {
      'assignment*' : this.doAssign
    }
  }

  parseLet(statement, tokens, lexifier) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    const variable = tokens.shift()
    if (variable.coding.startsWith('variable-')) {
      return lexifier.lexifyAssignment(variable, tokens)
    } else {
      return error(ErrorCodes.SYNTAX, variable.tokenStart, variable.tokenEnd)
    }
  }

  doAssign(machine, statement, interpreter) {
    const value = interpreter.interpretExpression(statement.value)
    if (value.error) { return value }

    const result = machine.variables.setValue(statement.variable, value, interpreter)
    if (result.error) { return result }
    return { done: true }
  }
}
