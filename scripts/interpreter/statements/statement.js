import {error, ErrorCodes} from "../errors.js";

// parsing handler signature:
// parseN(statement, tokens, lexifier)

// interpreter handler signature - for statements
// doN(machine, statement, interpreter)

// interpreter handler signature - for functions
// doN(machine, statement, paramValues, interpreter)

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

  static parseVariableList(tokens, lexifier) {
    let variables = []
    while (tokens.length > 0) {
      let token = tokens.shift()
      if (!token.coding.startsWith('variable-')) {
        return error(ErrorCodes.SYNTAX, token.tokenStart, token.tokenEnd)
      }
      variables.push(token)
      if (tokens.length > 0 && tokens[0].coding === 'open-paren') {
        const parenToken = tokens.shift()
        const result = lexifier.parseVariableDimensions(token, parenToken, tokens)
        if (result.error) { return result }
        tokens = result.restOfTokens
      }
      if (tokens.length > 0) {
        token = tokens.shift()
        if (token.coding !== 'comma') {
          return error(ErrorCodes.SYNTAX, token.tokenStart, token.tokenEnd)
        }
      }
    }
    return variables
  }

  static isRunning(machine) {
    return (machine.currentMode === 'RUN')
  }

  static isOnNumberedLine(statement) {
    return (statement.lineNumber !== null && statement.lineNumber >= 0)
  }

  static isUnexpectedDirectCommand(machine, statement) {
    return Statement.isRunning(machine) || Statement.isOnNumberedLine(statement)
  }

  static isUnexpectedProgramStatement(machine, statement) {
    return !Statement.isRunning(machine) || !Statement.isOnNumberedLine(statement)
  }
}