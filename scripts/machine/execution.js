export default class Execution {
  constructor(machine, options = {}) {
    this.machine = machine

    this.skipTo = null
    this.executionId = 0
    this.executionStack = []

    this.currentInput = null
  }

  setCurrentInput(input) {
    this.currentInput = input // default is null to clear
  }

  startExecution(localVariables, initialValues = {}) {
    const executionId = ++this.executionId
    this.executionStack.push({ id: executionId, localVariables: localVariables })

    // put local variables for this execution into the variable set
    for (const variable of localVariables) {
      //let varDef = { ...variable }
      const value = (variable.token in initialValues) ?
        initialValues[variable.token] :
        { value: (variable.valueType === 'string' ? '' : 0), valueType: variable.valueType }
      this.machine.variables.setValue(variable, value)
    }
    return executionId
  }

  endExecution(executionId) {
    const currentExecution = this.executionStack.pop()
    if (currentExecution.id !== executionId) {
      return error(ErrorCodes.CORRUPTED_SYSTEM, 0, 0, '')
    }
    // pull local variables out of variable lookup
    for (const variable of currentExecution.localVariables) {
      this.machine.variables.removeVariable(variable, executionId)
    }
    return { done: true }
  }

  getExecutionStack() {
    return this.executionStack.map((x) => x.id).reverse()
  }

  getExecutionVariableName(variableName) {
    if (this.executionStack.length > 0) {
      for (const executionId of this.getExecutionStack()) {
        variableName = `x${executionId}-${variableName}`
        const valueDef = this.machine.variables.getRawValue(variableName)
        if (valueDef) { break }
      }
    }
    return variableName
  }

  setExecutionSkip(skipTo) {
    if (!Array.isArray(skipTo)) { skipTo = [ skipTo ] }
    this.skipTo = skipTo
  }

  skipExecution(statement) {
    if (!this.skipTo) return false
    let foundEnd = false
    if (statement === 'eol' && this.skipTo.indexOf('eol') >= 0) {
      foundEnd = true
    } else if (this.skipTo.indexOf(`${statement.coding}|${statement.token}`) >= 0) {
      foundEnd = true
    } // NOTE: this means we can only stop at a specific statement
    if (foundEnd) { this.skipTo = null }
    return !foundEnd
  }
}
