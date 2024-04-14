import Statement from './statement.js'

export default class Print extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
//      'statement|PRINT' : this.parsePrint
    }
    this.interpreterHandlers = {
      'statement|PRINT' : this.doPrint
    }
  }

  doPrint(screen, machine, parameters) {
    let stringToDisplay = ''
    for (const parameter of parameters) {
      if (parameter.coding === 'string-literal') {
        stringToDisplay += parameter.token
      } else {
        return { error: 'Syntax Error', location: parameter.tokenStart, endLocation: parameter.tokenEnd }
      }
    }
    screen.displayStringAtCursor(stringToDisplay)
    return { done: true }
  }
}
