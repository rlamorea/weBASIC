import Statement from './statement.js'

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
    statement.parameters = tokens
    return statement
  }

  doPrint(machine, statement) {
    let stringToDisplay = ''
    let newline = true
    for (const parameter of statement.parameters) {
      newline = true
      switch (parameter.coding) {
        case 'string-literal':
          stringToDisplay += parameter.token
          break
        case 'variable-string':
          stringToDisplay += machine.variables.getValue(parameter)
          break
        case 'number-literal':
          stringToDisplay += parameter.token.toString()
          break
        case 'variable-number':
        case 'variable-integer':
          stringToDisplay += machine.variables.getValue(parameter).toString()
          break
        case 'semicolon':
          newline = false
          break
        default:
          return { error: 'Syntax Error', location: parameter.tokenStart, endLocation: parameter.tokenEnd }
      }
    }
    machine.currentScreen.displayString(stringToDisplay, newline)
    return { done: true }
  }
}
