import {error, ErrorCodes} from "../errors.js";

// parsing handler signature:
// parseN(statement, tokens, lexifier)

// interpreter handler signature:
// doN(machine, statement, interpreter)

function addHandlers(handlers, toAdd) {
  for (const handler in toAdd) {
    handlers[handler] = toAdd[handler]
  }
}

export default class Statement {
  constructor() {
    this.lexicalHandlers = {}
    this.interpreterHandlers = {}
  }

  addLexicalHandlers(handlers) {
    addHandlers(handlers, this.lexicalHandlers)
  }

  addInterpreterHandlers(handlers) {
    addHandlers(handlers, this.interpreterHandlers)
  }

  // helper methods
  static confirmParams(statement, paramValues, minimumCount, maximumCount, paramTypes) {
    if (paramValues.length < minimumCount || paramValues.length > maximumCount) {
      const errorStart = (paramValues.length === 0) ? statement.function.tokenStart : statement.parameters[0].tokenStart
      const errorEnd = (paramValues.length === 0) ? statement.function.tokenEnd : statement.parameters.slice(-1)[0].tokenEnd
      return error(ErrorCodes.SYNTAX, errorStart, errorEnd)
    }
    for (let idx = 0; idx < paramTypes.length; idx++) {
      if (idx >= paramValues.length) break
      if (paramValues[idx].valueType !== paramTypes[idx]) {
        return error(ErrorCodes.TYPE_MISMATCH, statement.parameters[idx].tokenStart, statement.parameters[idx].tokenEnd)
      }
    }
    return { success: true }
  }

  static valReturn(statement, value) {
    if (isNaN(value) || !isFinite(value)) {
      const errorStart = statement.parameters.length === 0 ? statement.function.tokenStart : statement.parameters[0].tokenStart
      const errorEnd = statement.parameters.length === 0 ? statement.function.tokenEnd : statement.parameters.slice(-1)[0].tokenEnd
      return error(ErrorCodes.ILLEGAL_VALUE, errorStart, errorEnd)
    }
    return { value, valueType: 'number' }
  }
}