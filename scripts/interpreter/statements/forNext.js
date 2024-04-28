import Statement from './statement.js'
import {error, ErrorCodes} from "../errors.js";

export default class ForNext extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|FOR' : this.parseFor,
      'statement|NEXT' : this.parseNext,
    }
    this.interpreterHandlers = {
      'statement|FOR' : this.doFor,
      'statement|NEXT' : this.doNext,
    }
  }

  parseFor(statement, tokens, lexifier) {
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    const indexVariable = tokens.shift()
    if (indexVariable.error) { return indexVariable }
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, indexVariable.tokenEnd) }
    if (indexVariable.coding !== 'variable-number' && indexVariable.coding !== 'variable-integer') {
      return error(ErrorCodes.TYPE_MISMATCH, indexVariable.tokenStart, indexVariable.tokenEnd)
    }
    const equal = tokens.shift()
    if (tokens.length === 0 || equal.coding !== 'equal') {
      return error(ErrorCodes.SYNTAX, equal.tokenStart, equal.tokenEnd)
    }
    const startTokens = lexifier.parseToToken('keyword', tokens, tokens[0].tokenStart, ErrorCodes.SYNTAX, 'TO')
    if (startTokens.error) { return startToken }
    tokens = startTokens.restOfTokens
    const startExpression = lexifier.parseExpression(startTokens.insideTokens, startTokens.insideTokens[0].tokenStart)
    if (startExpression.error) { return startExpression }
    if (startExpression.valueType === 'string') {
      return error(ErrorCodes.TYPE_MISMATCH, startExpression.tokenStart, startExpression.tokenEnd)
    }
    const endTokens = lexifier.parseToToken('keyword', tokens, tokens[0].tokenStart, null, 'STEP')
    if (endTokens.error) { return endTokens }
    tokens = endTokens.restOfTokens
    const endExpression = lexifier.parseExpression(endTokens.insideTokens, endTokens.insideTokens[0].tokenStart)
    if (endExpression.error) { return endExpression }
    let stepExpression = null
    if (endTokens.closeToken) {
      stepExpression = lexifier.parseExpression(tokens, tokens[0].tokenStart)
      if (stepExpression.error) { return stepExpression }
    }
    statement.indexVariable = indexVariable
    statement.startExpression = startExpression
    statement.endExpression = endExpression
    statement.stepExpression = stepExpression
    return statement
  }

  parseNext(statement, tokens, lexifiier) {
    if (tokens.length > 0 && !(tokens[0].coding === 'variable-number' || tokens[0].coding === 'variable-integer')) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, tokens[0].tokenEnd)
    }
    if (tokens.length > 0) {
      statement.indexVariable = tokens.shift()
      if (tokens.length > 0) {
        return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens[0].tokenEnd)
      }
    }
    return statement
  }

  doFor(machine, statement, interpreter) {
    const indexVariable = statement.indexVariable
    const startValue = interpreter.interpretExpression(statement.startExpression)
    if (startValue.error) { return startValue }
    machine.variables.setValue(indexVariable, startValue)

    const endValue = interpreter.interpretExpression(statement.endExpression)
    if (endValue.error) { return endValue }

    let stepValue = { value: 1, valueType: 'number' }
    if (statement.stepExpression) {
      stepValue = interpreter.interpretExpression(statement.stepExpression)
      if (stepValue.error) { return stepValue }
    }

    const indexValue = machine.variables.getValue(indexVariable)
    machine.execution.startForLoop(indexVariable, startValue, endValue, stepValue)
    return { done: true }
  }

  doNext(machine, statement, interpreter) {
    const result = machine.execution.nextForLoop(statement.indexVariable, statement)
    if (result.error) { return result }
    return { done: true }
  }
}
