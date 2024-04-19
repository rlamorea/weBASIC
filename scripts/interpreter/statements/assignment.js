import Statement from './statement.js'

export default class Assignment extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = { }
    this.interpreterHandlers = {
      'assignment*' : this.doAssign
    }
  }

  doAssign(machine, statement) {
    if (statement.value.coding === 'number-literal') {
      let v = statement.variable.coding.endsWith('-integer') ? parseInt(statement.value.token) : parseFloat(statement.value.token)
      if (isNaN(v) || !isFinite(v)) {
        return { error: `Illegal Value ${statement.value.token}`, location: statement.value.tokenStart, endLocation: statement.value.tokenEnd }
      }
      machine.variables.setValue(statement.variable, v)
    } else if (statement.value.coding === 'string-literal') {
      machine.variables.setValue(statement.variable, statement.value.token)
    } else {
      return { error: 'Unsupported Operation', location: statement.variable.tokenStart, endLocation: statement.value.tokenEnd }
    }
    return { done: true }
  }
}
