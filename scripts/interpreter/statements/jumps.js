import Statement from './statement.js'
import {ErrorCodes, error, errorat, ErrorCodes as ErroCodes} from '../errors.js'
import {test} from "uvu";

function calculateLine(goLine, interpreter) {
  const goLineValue = interpreter.interpretExpression(goLine)
  if (goLineValue.error) { return goLineValue }
  if (goLineValue.valueType !== 'number') {
    return error(ErrorCodes.SYNTAX, goLine.tokenStart, goLine.tokenEnd)
  }
  if (goLineValue.value < 0) {
    return error(ErrorCodes.ILLEGAL_LINE, goLine.tokenStart, goLine.tokenEnd)
  }
  return goLineValue.value
}

function gotoReturn(goLineNumber) {
  return { done: true, redirectLine: goLineNumber }
}

function gosubReturn(machine, goLineNumber) {
  machine.runCodespace.gosubStack.push({
    lineIndex: machine.runCodespace.lineNumberIndex,
    statementIndex: machine.runCodespace.currentStatementIndex,
    codeLine: machine.runCodespace.codeLine
  })
  return { done: true, redirectLine: goLineNumber }
}

export default class Jumps extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|GOTO': this.parseGotoGosub,
      'statement|GOSUB': this.parseGotoGosub,
      'statement|RETURN': this.parseReturn,
      'statement|ON': this.parseOnGotoGosub,
    }
    this.interpreterHandlers = {
      'statement|GOTO': this.doGoto,
      'statement|GOSUB': this.doGosub,
      'statement|RETURN': this.doReturn,
      'statement|ON': this.doOnGotoGosub,
    }
  }

  parseGotoGosub(statement, tokens, lexifier) {
    // TODO: eventually this will take a labels as well as line numbers
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    if (tokens.length > 0) {
      const expression = lexifier.parseExpression(tokens, tokens[0].tokenStart)
      if (expression.error) { return expression }
      statement.goLine = expression
    }
    return statement
  }

  parseReturn(statement, tokens, lexifier) {
    if (tokens.length > 0) { return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd) }
    return statement
  }

  parseOnGotoGosub(statement, tokens, lexifier) {
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }

    const { parsedTokens, restOfTokens } = lexifier.parseTokensUntil(
      tokens, [ 'statement|GOTO', 'statement|GOSUB' ]
    )
    tokens = restOfTokens
    if (parsedTokens.length === 0) {
      return error(ErroCodes.SYNTAX, statement.tokenEnd, tokens[0].tokenStart)
    }
    const test = lexifier.parseExpression(parsedTokens, parsedTokens[0].tokenStart)
    if (test.error) { return test }
    statement.testExpression = test
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, testTokens.slice(-1)[0].tokenEnd, testTokens.slice(-1)[0].tokenEnd)
    }

    const goToken = tokens.shift()
    if (goToken.coding !== 'statement' || (goToken.token !== 'GOTO' && goToken.token !== 'GOSUB')) {
      return error(ErrorCodes.SYNTAX, goToken.tokenStart, goToken.tokenEnd)
    }
    statement.goMethod = goToken

    let lineList = []
    while (tokens.length > 0) {
      const lineToken = tokens.shift()
      if (lineToken.coding !== 'number-literal') {
        return error(ErrorCodes.SYNTAX, lineToken.tokenStart, lineToken.tokenEnd)
      }
      const lineNumber = parseInt(lineToken.token)
      if (isNaN(lineNumber) || !isFinite(lineNumber) || lineNumber < 0) {
        return error(ErrorCodes.ILLEGAL_LINE, lineToken.tokenStart, lineToken.tokenEnd)
      }
      lineList.push(lineNumber)
      if (tokens.length > 0) {
        const comma = tokens.shift()
        if (comma.coding !== 'comma' || tokens.length === 0) {
          return error(ErrorCodes.SYNTAX, comma.tokenStart, comma.tokenEnd)
        }
      }
    }
    statement.goLineNumbers = lineList

    return statement
  }

  doGoto(machine, statement, interpreter) {
    const goLineNumber = calculateLine(statement.goLine, interpreter)
    if (goLineNumber.error) { return goLineNumber }

    return gotoReturn(goLineNumber)
  }

  doGosub(machine, statement, interpreter) {
    const goLineNumber = calculateLine(statement.goLine, interpreter)
    if (goLineNumber.error) { return goLineNumber }
    return gosubReturn(machine, goLineNumber)
  }

  doReturn(machine, statement, interpreter) {
    if (machine.runCodespace.gosubStack.length === 0) {
      return error(ErrorCodes.UNEXPECTED_RETURN, statement.tokenStart, statement.tokenEnd)
    }
    const returnState = machine.runCodespace.gosubStack.pop()
    machine.runCodespace.lineNumberIndex = returnState.lineIndex
    machine.runCodespace.currentStatementIndex = returnState.statementIndex
    machine.runCodespace.codeLine = returnState.codeLine
    return { done: true }
  }

  doOnGotoGosub(machine, statement, interpreter) {
    const testValue = interpreter.interpretExpression(statement.testExpression)
    if (testValue.error) { return testValue }
    if (testValue.valueType !== 'number') {
      return error(ErrorCodes.SYNTAX, statement.testExpression.tokenStart, statement.testExpression.tokenEnd)
    }
    const test = Math.trunc(testValue.value) - 1
    const lineNumbers = statement.goLineNumbers || []
    if (test >= 0 && test < lineNumbers.length) {
      const goLineNumber = lineNumbers[test]
      if (statement.goMethod.token === 'GOSUB') {
        return gosubReturn(machine, goLineNumber)
      } else {
        return gotoReturn(goLineNumber)
      }
    }
    // fall through -- just proceed with next statement
    return { done: true }
  }
}
