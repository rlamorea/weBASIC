import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class Assignment extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|LET': this.parseLet,
      'statement|DIM': this.parseDim
    }
    this.interpreterHandlers = {
      'assignment*' : this.doAssign,
      'statement|DIM' : this.doDim
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

  parseDim(statement, tokens, lexifier) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    statement.parameters = []
    while (tokens.length > 0) {
      const variable = tokens.shift()
      if (!variable.coding.startsWith('variable-') || tokens.length === 0) {
        return error(ErrorCodes.SYNTAX, variable.tokenStart, variable.tokenEnd)
      }
      const paren = tokens.shift()
      if (paren.coding !== 'open-paren' || tokens.length === 0) {
        return error(ErrorCodes.SYNTAX, variable.tokenStart, paren.tokenEnd)
      }
      const result = lexifier.parseVariableDimensions(variable, paren, tokens)
      if (result.error) { return result }
      statement.parameters.push(variable)
      tokens = result.restOfTokens
      if (tokens.length > 0) {
        const comma = tokens.shift()
        if (comma.coding !== 'comma') {
          return error(ErrorCodes.SYNTAX, comma.tokenStart, comma.tokenEnd)
        }
      }
    }
    return statement
  }

  doAssign(machine, statement, interpreter) {
    const value = interpreter.interpretExpression(statement.value)
    if (value.error) { return value }

    const result = machine.variables.setValue(statement.variable, value, interpreter)
    if (result.error) { return result }
    return { done: true }
  }

  doDim(machine, statement, interpreter) {
    for (const variable of statement.parameters) {
      const result = machine.variables.dimensionArray(variable, machine, interpreter)
      if (result.error) { return result }
    }
    return { done: true }
  }
}
