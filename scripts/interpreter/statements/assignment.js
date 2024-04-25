import Statement from './statement.js'

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
      return { error: 'Syntax Error', location: statement.tokenStart, endLocation: statement.tokenEnd }
    }
    const variable = tokens.shift()
    if (variable.coding.startsWith('variable-')) {
      return lexifier.lexifyAssignment(variable, tokens)
    } else {
      return { error: 'Syntax Error', location: variable.tokenStart, endLocation: variable.tokenEnd }
    }
  }

  doAssign(machine, statement, interpreter) {
    const value = interpreter.interpretExpression(statement.value)
    if (value.error) { return value }

    machine.variables.setValue(statement.variable, value, interpreter)
    return { done: true }
  }
}
