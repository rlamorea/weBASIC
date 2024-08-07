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
      activeIfCondition: null,
      executionStack: [],
      forStack: [],
      gosubStack: [],
      dataLines: [],
      dataStatements: {},
      dataIndex: { lineIndex: -1, valueIndex: -1 },
      promise: null,
      resolve: null,
      reject: null
    }
  }

  resetCodespaceAfterRun(codespace, resetAll = true) {
    codespace.running = false
    this.gotBreak = false
    // preserve the rest in case we restart
  }

  resetCodespaceToNew(codespace) {
    this.prepCodespaceForRun(codespace)
    codespace.lineNumbers = []
    codespace.codeLines = {}
  }

  prepCodespaceForRun(codespace) {
    codespace.running = false
    codespace.codeLine = null
    codespace.lineNumberIndex = 0
    codespace.currentLineNumber = -1
    codespace.currentStatementIndex = -1
    codespace.skipTo = null
    codespace.activeIfCondition = null
    codespace.executionStack = []
    codespace.forStack = []
    codespace.gosubStack = []
    codespace.dataLines = []
    codespace.dataStatements = {}
    codespace.dataIndex.lineIndex = -1
    codespace.dataIndex.valueIndex = -1
    this.gotBreak = false
  }

  deleteCodeLine(codespace, lineNumber, lineIndex = -1) {
    if (lineIndex < 0) {
      ;({ lineIndex } = this.indexForLineNumber(codespace, lineNumber))
    }
    if (lineIndex >= 0) {
      codespace.lineNumbers.splice(lineIndex, 1)
      delete codespace.codeLines[lineNumber]
    }
    return lineIndex
  }

  addCodeLine(codespace, lineNumber, codeLine, allowedList) {
    if (codespace.running) { debugger }
    const statements = this.interpreter.prepLine(codeLine, lineNumber < 0, allowedList)
    if (statements.error && !statements.lineNumber ) { return statements }

    if (lineNumber < 0) {
      lineNumber = parseInt(statements.lineNumber)
    }
    let lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
    let inserted = false
    if (lineNumberIndex < 0) {
      codespace.lineNumbers.push(lineNumber)
      codespace.lineNumbers = codespace.lineNumbers.sort((a,b) => { return a-b })
      lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
      inserted = true
    } else {
      delete codespace.codeLines[lineNumber] // clean up
    }
    let codeInsert = { text: codeLine }
    if (statements.error) {
      codeInsert.error = {
        error: statements.error, location: statements.location, endLocation: statements.endLocation, lineNumber: lineNumber
      }
    } else {
      codeInsert.statements = statements.lineStatements
    }
    codespace.codeLines[lineNumber] = codeInsert
    let returnVal = { done: true, lineNumberIndex, inserted }
    if (statements.error) { returnVal = { ...returnVal, ...statements } }
    return returnVal
  }

  stopExecution(codespace, method, statement, newMode, prepNewMode) {
    if (method === 'break') {
      let err = errorat(ErrorCodes.BREAK, `in line ${codespace.currentLineNumber}`, statement.tokenStart, statement.tokenEnd, ' ')
      if (codespace.mode === 'LIVE') { err = error(ErrorCodes.BREAK, -1, null, ' ') }
      err.newMode = 'LIVE'
      codespace.resolve(err)
      return err
    } else { // end
      const result = { done: true, newMode, prepNewMode }
      codespace.resolve(result)
      return result
    }
  }

  indexForLineNumber(codespace, lineNumber, nearest = null) { // -1 for first line
    if (codespace.lineNumbers.length === 0) { return -2 } // no lines
    if (lineNumber < 0) { return 0 }
    const exactMatchIndex = codespace.lineNumbers.indexOf(lineNumber)
    if (exactMatchIndex >= 0) { return { lineIndex: exactMatchIndex, existing: true, lineNumber: lineNumber } }
    if (!nearest) { return { lineIndex: -1, existing: false } } // line not found
    // find nearest before or after lineNumber
    let nearestIdx = 0
    const max = codespace.lineNumbers.length
    while (codespace.lineNumbers[nearestIdx] < lineNumber && nearestIdx < max) { nearestIdx++ }
    nearestIdx = (nearest === 'before') ? Math.max(0, nearestIdx - 1) : Math.min(nearestIdx, max - 1)
    return {
      lineIndex: nearestIdx,
      existing: false,
      lineNumber: codespace.lineNumbers[nearestIdx]
    }
  }

  async runLoop(carryThrough = {}) {
    let codespace = this.currentCodespace
    if (codespace.codeLine && codespace.currentStatementIndex >= codespace.codeLine.length) {
      this.skipExecution(codespace,'eol')
      codespace.activeIfCondition = null // this clears on eol (if that is a skip condition)
      codespace.lineNumberIndex += 1
      if (codespace.lineNumberIndex >= codespace.lineNumbers.length) {
        return this.stopExecution(codespace, 'end', null, carryThrough.newMode, carryThrough.prepNewMode)
      }
      codespace.currentLineNumber = codespace.lineNumbers[codespace.lineNumberIndex]
      codespace.codeLine = null
    }
    if (!codespace.codeLine) {
      codespace.codeLine = codespace.codeLines[codespace.currentLineNumber].statements
      if (!codespace.codeLine) {
        const err = errorat(ErrorCodes.UNKNOWN_LINE, codespace.currentLineNumber)
        codespace.resolve(err)
        return err
      }
      codespace.currentStatementIndex = 0
    }
    const statement = codespace.codeLine[codespace.currentStatementIndex]
    if (this.gotBreak) {
      this.gotBreak = false
      return this.stopExecution(codespace, 'break', statement, 'LIVE')
    }
    if (!this.skipExecution(codespace, statement)) {
      const result = await this.interpreter.interpretStatement(statement)
      this.runStatementCount += 1
      if (result.error) {
        codespace.resolve(result)
        return result
      }
      carryThrough.newMode ||= result.newMode
      carryThrough.prepNewMode ||= result.prepNewMode
      if (result.stopExecution) {
        return this.stopExecution(codespace, result.stopExecution, statement, result.newMode, result.prepNewMode)
      } else if (result.redirectLine !== undefined) {
        codespace.currentLineNumber = result.redirectLine
        codespace.codeLine = null
        const lineIndex = this.indexForLineNumber(codespace, codespace.currentLineNumber)
        if (!lineIndex.existing) {
          const err = errorat(ErrorCodes.UNKNOWN_LINE, codespace.currentLineNumber)
          codespace.resolve(err)
          return err
        }
        codespace.lineNumberIndex = lineIndex.lineIndex
      }
    }
    codespace.currentStatementIndex += 1
    setTimeout( () => { this.runLoop(carryThrough) }, this.loopDelay)

    return codespace.promise
  }

  async runCode(codespace, lineNumber = -1) {
    if (this.currentCodespace) { debugger } // shouldn't happen, so stop now
    if (codespace.lineNumbers.length === 0) { return { done: true } } // nothing to do!

    if (lineNumber >= 0 || codespace.currentLineNumber < 0) {
      if (lineNumber < 0) { lineNumber = codespace.lineNumbers[0] } // start from beginning
      codespace.lineNumberIndex = codespace.lineNumbers.indexOf(lineNumber)
      if (codespace.lineNumberIndex < 0) { return errorat(ErrorCodes.UNKNOWN_LINE, `${lineNumber}`) }

      codespace.currentLineNumber = lineNumber
      codespace.currentStatementIndex = 0
    }

    this.currentCodespace = codespace
    this.machine.io.enableBreak()
    this.machine.io.enableCapture()
    codespace.running = true

    codespace.promise = new Promise((resolve, reject) => {
      codespace.resolve = resolve
      codespace.reject = reject
    })

    this.runStatementCount = 0
    const startTime = Date.now()
    let result = { done: true }
    try {
      result = await this.runLoop()
    } catch (e) {
      result = error(e)
    }
    this.currentCodespace = null
    const elapsedTime = (Date.now() - startTime) / 1000
    console.log(`Run: ${this.runStatementCount} statements in ${elapsedTime}s`)

    // reset IO
    this.machine.io.enableCapture(false)
    this.machine.io.enableBreak(false)
    this.machine.io.setActiveListener()
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

  setActiveIfCondition(codespace, result) {
    codespace.activeIfCondition = result
  }

  getActiveIfCondition(codespace) {
    // NOTE: getting will automatically clear this
    const result = codespace.activeIfCondition
    codespace.activeIfCondition = null
    return result
  }

  setExecutionSkip(codespace, skipTo) {
    if (!Array.isArray(skipTo)) { skipTo = [ skipTo ] }
    codespace.skipTo = skipTo
  }

  skipExecution(codespace, statement) {
    if (!codespace.skipTo) return false
    let foundEnd = false
    if (statement === 'eol' && codespace.skipTo.indexOf('eol') >= 0) {
      foundEnd = true
    } else if (codespace.skipTo.indexOf(`${statement.coding}|${statement.token}`) >= 0) {
      foundEnd = true
    } // NOTE: this means we can only stop at a specific statement
    if (foundEnd) { codespace.skipTo = null }
    return !foundEnd
  }

  startForLoop(indexVariable, startValue, endValue, stepValue) {
    if (!this.currentCodespace) { debugger }
    this.currentCodespace.forStack.push({
      codeLine: this.currentCodespace.codeLine,
      lineNumberIndex: this.currentCodespace.lineNumberIndex,
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
      this.currentCodespace.codeLine = forLoop.codeLine
      this.currentCodespace.lineNumberIndex = forLoop.lineNumberIndex
      this.currentCodespace.currentLineNumber = forLoop.lineNumber
      this.currentCodespace.currentStatementIndex = forLoop.statementIndex
    }
    return { done: true }
  }
}
