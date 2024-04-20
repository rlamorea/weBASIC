import Statement from './statement.js'

export default class Assignment extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = { }
    this.interpreterHandlers = {
      'assignment*' : this.doAssign
    }
  }

  doAssign(machine, statement, interpreter) {
    const value = interpreter.interpretExpression(statement.value)
    if (value.error) { return value }

    machine.variables.setValue(statement.variable, value)
    return { done: true }
  }
}
