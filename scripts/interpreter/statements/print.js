import Statement from './statement.js'

function addParam(params, paramTokens, lexifier) {
  if (paramTokens.length > 0) {
    const expression = lexifier.parseExpression(paramTokens, paramTokens[0].tokenStart)
    if (expression.error) { return expression }
    params.push(expression)
  }
  return params
}

export default class Print extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|PRINT' : this.parsePrint
    }
    this.interpreterHandlers = {
      'statement|PRINT' : this.doPrint
    }
  }

  parsePrint(statement, tokens, lexifier) {
    // NOTE that weBASIC print does not support "cram concat" -- you must use semicolon or comma between expressions to display
    let params = []
    let paramTokens = []
    while (1 === 1) {
      if (tokens.length === 0) {
        params = addParam(params, paramTokens, lexifier)
        if (params.error) { return params }
        break
      }
      const token = tokens.shift()
      if (token.coding === 'semicolon' || token.coding === 'comma') {
        params = addParam(params, paramTokens, lexifier)
        if (params.error) { return params }
        paramTokens = []
        params.push(token)
      } else {
        paramTokens.push(token)
      }
    }
    statement.parameters = params
    return statement
  }

  doPrint(machine, statement, interpreter) {
    let stringToDisplay = ''
    let newline = true
    for (const parameter of statement.parameters) {
      newline = true
      switch (parameter.coding) {
        case 'string-literal':
          stringToDisplay += parameter.token
          break
        case 'variable-string':
          stringToDisplay += machine.variables.getValue(parameter).value
          break
        case 'number-literal':
          stringToDisplay += parameter.token.toString()
          break
        case 'variable-number':
        case 'variable-integer':
          stringToDisplay += machine.variables.getValue(parameter, interpreter).value.toString()
          break
        case 'calculation':
          const value = interpreter.interpretExpression(parameter)
          if (value.error) { return value }
          stringToDisplay += value.value.toString()
          break
        case 'comma': // TODO: handle commas, for now treat like semicolons
        case 'semicolon':
          newline = false
          break
        default:
          return error(ErrorCodes.SYNTAX_ERROR, parameter.tokenStart, parameter.tokenEnd)
      }
    }
    machine.currentScreen.displayString(stringToDisplay, newline)
    return { done: true }
  }
}
