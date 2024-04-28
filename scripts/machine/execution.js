import Interpreter from '../interpreter/interpreter.js'
import {errorat, ErrorCodes as ErrorCode, ErrorCodes} from '../interpreter/errors.js'

export default class Execution {
  constructor(machine, options = {}) {
    this.machine = machine
    this.executionId = 0

    this.interpreter = new Interpreter(this.machine)
    this.currentCodespace = null
  }

  setCurrentInput(input) {
    if (input) {
      this.machine.io.enableCapture(false)
      this.machine.io.setActiveListener(input)
    } else {
      this.machine.io.setActiveListener()
      this.machine.io.enableCapture(this.running)
    }
  }

  createCodespace(mode) {
    return {
      lineNumbers: [],
      codeLines: {},
      mode,
      running: false,
      currentLineNumber: -1,
      currentStatementIndex: 0,
      skipTo: null,
      executionStack: [],
      forStack: []
    }
  }

  addCodeLine(codespace, lineNumber, codeLine) {
    if (codespace.running) { debugger }
    const statements = this.interpreter.prepLine(codeLine)
    if (statements.error) { return statements }

    const lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
    if (lineNumberIndex < 0) {
      codespace.lineNumbers.push(lineNumber)
      codespace.lineNumbers = codespace.lineNumbers.sort()
    } else {
      delete codespace.codeLines[lineNumber] // clean up
    }
    codespace.codeLines[lineNumber] = statements.lineStatements
    return { done: true }
  }

  async runCode(codespace, lineNumber = -1) {
    if (this.currentCodespace) { debugger } // shouldn't happen, so stop now
    if (codespace.lineNumbers.length === 0) { return { done: true } } // nothing to do!

    if (lineNumber < 0) { lineNumber = codespace.lineNumbers[0] } // start from beginning
    let lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
    if (lineNumberIndex < 0) { return errorat(ErrorCode.UNKNOWN_LINE, `${lineNumber}`) }

    codespace.currentLineNumber = lineNumber
    codespace.currentStatementIndex = 0

    let newLine = true
    this.currentCodespace = codespace
    codespace.running = true
    let codeLine = null
    let statement = null
    while (codespace.running) {
      if (!newLine && codespace.currentStatementIndex >= codeLine.length) {
        this.skipExecution('eol')
        lineNumberIndex += 1
        if (lineNumberIndex >= codespace.lineNumbers.length) { break }
        codespace.currentLineNumber = codespace.lineNumbers[lineNumberIndex]
        newLine = true
      }
      if (newLine) {
        codeLine = codespace.codeLines[codespace.currentLineNumber]
        if (!codeLine) {
          codespace.running = false
          this.currentCodespace = null
          return errorat(ErrorCode.UNKNOWN_LINE, codespace.currentLineNumber)
        }
        codespace.currentStatementIndex = 0
        newLine = false
      }
      statement = codeLine[codespace.currentStatementIndex]
      if (!this.skipExecution(statement)) {
        const result = await this.interpreter.interpretStatement(statement)
        if (result.error) {
          codespace.running = false
          this.currentCodespace = null
          return result
        }
      }
      codespace.currentStatementIndex += 1
    }
    codespace.running = false
    this.currentCodespace = null
    return { done: true }
  }

  startExecution(localVariables, initialValues = {}) {
    if (!this.currentCodespace) { debugger }
    const executionId = ++this.executionId
    this.currentCodespace.executionStack.push({ id: executionId, localVariables: localVariables })

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
    if (!this.currentCodespace) { debugger }
    const currentExecution = this.currentCodespace.executionStack.pop()
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
    if (!this.currentCodespace) { debugger }
    return this.currentCodespace.executionStack.map((x) => x.id).reverse()
  }

  getExecutionVariableName(variableName) {
    if (this.currentCodespace && this.currentCodespace.executionStack.length > 0) {
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
