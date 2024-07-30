import Statement from './statement.js'
import { error, ErrorCodes } from "../errors.js";

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
      if (token.coding === 'open-paren') {
        paramTokens.push(token)
        if (tokens.length === 0) {
          return error(ErrorCodes.UNCLOSED_PAREN, token.tokenStart, token.tokenEnd)
        }
        const parenTokens = lexifier.parseToCloseParen(tokens, token.tokenStart)
        if (parenTokens.error) { return parenTokens }
        paramTokens.push(...parenTokens.parenTokens)
        paramTokens.push(parenTokens.closeParen)
        tokens = parenTokens.restOfTokens
      } else if (token.coding === 'semicolon' || token.coding === 'comma') {
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
          const varString = machine.variables.getValue(parameter, interpreter)
          if (varString.error) { return varString }
          stringToDisplay += varString.value
          break
        case 'variable-number':
        case 'variable-integer':
          const varVal = machine.variables.getValue(parameter, interpreter)
          if (varVal.error) { return varVal }
          stringToDisplay += varVal.value.toString()
          break
        case 'number-literal':
        case 'function':
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
          return error(ErrorCodes.SYNTAX, parameter.tokenStart, parameter.tokenEnd)
      }
    }
    machine.currentScreen.displayString(stringToDisplay, newline)
    return { done: true }
  }
}
