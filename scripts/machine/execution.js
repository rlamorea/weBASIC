import Interpreter from '../interpreter/interpreter.js'
import { error, errorat, ErrorCodes } from '../interpreter/errors.js'

const defaultLoopDelay = 1 // 2ms for now, will lower this as we can

export default class Execution {
  constructor(machine, options = {}) {
    this.machine = machine
    this.executionId = 0

    this.interpreter = new Interpreter(this.machine)
    this.currentCodespace = null

    this.gotBreak = false
    this.loopDelay = defaultLoopDelay
  }

  break() {
    this.gotBreak = true
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
      lineNumberIndex: 0,
      codeLine: null,
      currentLineNumber: -1,
      currentStatementIndex: 0,
      skipTo: null,
      executionStack: [],
      forStack: [],
      promise: null,
      resolve: null,
      reject: null
    }
  }

  resetCodespaceAfterRun(codespace) {
    codespace.running = false
    codespace.codeLine = null
    codespace.lineNumberIndex = 0
    codespace.currentLineNumber = -1
    codespace.currentStatementIndex = -1
    codespace.skipTo = null
    codespace.executionStack = []
    codespace.forStack = []
  }

  addCodeLine(codespace, lineNumber, codeLine, allowedList) {
    if (codespace.running) { debugger }
    const statements = this.interpreter.prepLine(codeLine, lineNumber >= 0, allowedList)
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

  async runLoop(carryThrough = {}) {
    let codespace = this.currentCodespace
    if (codespace.codeLine && codespace.currentStatementIndex >= codespace.codeLine.length) {
      this.skipExecution('eol')
      codespace.lineNumberIndex += 1
      if (codespace.lineNumberIndex >= codespace.lineNumbers.length) {
        const result = { done: true, preserveListener: carryThrough.preserveListener }
        codespace.resolve(result)
        return result
      }
      codespace.currentLineNumber = codespace.lineNumbers[lineNumberIndex]
      codespace.codeLine = null
    }
    if (!codespace.codeLine) {
      codespace.codeLine = codespace.codeLines[codespace.currentLineNumber]
      if (!codespace.codeLine) {
        const err = errorat(ErrorCodes.UNKNOWN_LINE, codespace.currentLineNumber)
        codespace.resolve(err)
        return err
      }
      codespace.currentStatementIndex = 0
    }
    const statement = codespace.codeLine[codespace.currentStatementIndex]
    if (this.gotBreak) {
      let err = errorat(ErrorCodes.BREAK, `in line ${codespace.currentLineNumber}`, statement.tokenStart, statement.tokenEnd, ' ')
      if (codespace.mode === 'LIVE') { err = error(ErrorCodes.BREAK, -1, null, ' ') }
      codespace.resolve(err)
      return err
    }
    if (!this.skipExecution(statement)) {
      const result = await this.interpreter.interpretStatement(statement)
      if (result.error) {
        codespace.resolve(result)
        return result
      }
      carryThrough.preserveListener ||= result.preserveListener
    }
    codespace.currentStatementIndex += 1
    setTimeout( () => { this.runLoop(carryThrough) }, this.loopDelay)

    return codespace.promise
  }

  async runCode(codespace, lineNumber = -1) {
    if (this.currentCodespace) { debugger } // shouldn't happen, so stop now
    if (codespace.lineNumbers.length === 0) { return { done: true } } // nothing to do!

    if (lineNumber < 0) { lineNumber = codespace.lineNumbers[0] } // start from beginning
    codespace.lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
    if (codespace.lineNumberIndex < 0) { return errorat(ErrorCodes.UNKNOWN_LINE, `${lineNumber}`) }

    codespace.currentLineNumber = lineNumber
    codespace.currentStatementIndex = 0

    this.currentCodespace = codespace
    this.machine.io.enableBreak()
    this.machine.io.enableCapture()
    codespace.running = true

    codespace.promise = new Promise((resolve, reject) => {
      codespace.resolve = resolve
      codespace.reject = reject
    })

    let result = { done: true }
    try {
      result = await this.runLoop()
    } catch (e) {
      result = error(e)
    }
    this.currentCodespace = null
    // reset IO
    this.machine.io.enableCapture(false)
    this.machine.io.enableBreak(false)
    if (!result.preserveListener) { this.machine.io.setActiveListener() }
    this.resetCodespaceAfterRun(codespace)
    return result
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

  startForLoop(indexVariable, startValue, endValue, stepValue) {
    if (!this.currentCodespace) { debugger }
    this.currentCodespace.forStack.push({
      lineNumber: this.currentCodespace.currentLineNumber,
      statementIndex: this.currentCodespace.currentStatementIndex,
      indexVariable, startValue, endValue, stepValue
    })
  }

  nextForLoop(indexVariable, statement) {
    if (!this.currentCodespace) { debugger }
    if (this.currentCodespace.forStack.length === 0) {
      return error(ErrorCodes.UNEXPECTED_NEXT, statement.tokenStart, statement.tokenEnd)
    }
    let forLoop = this.currentCodespace.forStack.pop()
    if (indexVariable && indexVariable.token !== forLoop.indexVariable.token) {
      return error(ErrorCodes.UNEXPECTED_NEXT, statement.tokenStart, indexVariable.tokenEnd)
    }
    let indexValue = this.machine.variables.getValue(forLoop.indexVariable)
    if (indexValue.error) { return indexValue }
    // increment index
    const stepVal = forLoop.stepValue.value
    indexValue.value += stepVal
    if (forLoop.indexVariable.coding === 'variable-integer') { indexValue.value = Math.trunc(indexValue.value) }

    // check end condition
    if ((stepVal >= 0 && indexValue.value <= forLoop.endValue.value) ||
        (stepVal < 0 && indexValue.value >= forLoop.endValue.value)) {
      this.currentCodespace.forStack.push(forLoop)
      this.currentCodespace.currentLineNumber = forLoop.lineNumber
      this.currentCodespace.currentStatementIndex = forLoop.statementIndex
    }
    return { done: true }
  }
}
