import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class DefFn extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|DEF': this.parseDefFn,
      'function|FN': this.parseFn
    }
    this.interpreterHandlers = {
      'statement|DEF': this.doDefFn,
      'function|FN': this.doFn
    }
  }

  static parseFnNameAndParams(tokens, lexifier) {
    const functionName = tokens.shift()
    if (!functionName.coding.startsWith('variable-') || tokens.length === 0 || tokens[0].coding !== 'open-paren') {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, functionName.tokenEnd)
    }
    const openParen = tokens.shift()
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, openParen.tokenStart, openParen.tokenEnd)}
    const parenTokens = lexifier.parseToCloseParen(tokens, tokens[0].tokenStart)
    if (parenTokens.error) { return parenTokens }
    if (parenTokens.parenTokens.length === 0) { return error(ErrorCodes.SYNTAX, openParen.tokenStart, parenTokens.closeParen.tokenEnd) }
    tokens = parenTokens.restOfTokens
    const tokenEnd = parenTokens.closeParen.tokenEnd
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, parenTokens.closeParen.tokenStart, parenTokens.closeParen.tokenEnd)
    }
    const params = lexifier.parseIntoParameters(parenTokens.parenTokens, parenTokens[0].tokenStart)
    if (params.error) { return params }
    return { functionName, parameters: params.parameters, restOfTokens: tokens, tokenEnd }
  }

  parseDefFn(statement, tokens, lexifier) {
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    const result = DefFn.parseFnNameAndParams(tokens, lexifier)
    if (result.error) { return result }
    for (const param of result.parameters) {
      if (!param.coding.startsWith('variable-')) { return error(ErrorCodes.SYNTAX, param.tokenStart, param.tokenEnd) }
    }
    statement.functionName = result.functionName
    statement.parameters = result.parameters
    const equal = tokens.shift()
    if (equal.coding !== 'equal' || tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, equal.tokenStart, equal.tokenEnd)
    }
    const expression = lexifier.parseExpression(tokens, tokens[0].tokenStart)
    if (expression.error) { return expression }
    statement.expression = expression
    statement.valueType = (statement.functionName.coding === 'variable-string') ? 'string' : 'number'

    return statement
  }

  parseFn(statement, tokens, lexifier) {
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    const result = DefFn.parseFnNameAndParams(tokens, lexifier)
    if (result.error) { return result }
    return {
      coding: 'function',
      function: statement,
      parameters: result.parameters,
      valueType: statement.functionName.valueType,
      tokenStart: statement.tokenStart,
      tokenEnd: result.tokenEnd,
      restOfTokens: result.restOfTokens
    }
  }

  doDefFn(machine, statement, interpreter) {
    const functionName = statement.functionName
    if (this.machine.variables.getRawValue(functionVarName.token)) {
      return error(ErrorCodes.ILLEGAL_REASSIGN, statement.tokenStart, statement.tokenEnd)
    }
    const valueDef = {
      value: statement,
      valueType: 'function'
    }
    const result = this.machine.variables.setValue(functionName, valueDef, interpreter)
    if (result.error) { return result }

    return { done: true }
  }

  doFn(machine, statement, paramValues, interpreter) {
    const paramCount = statement.parameters.length
    const paramTypes = statement.parameters.map((x) => x.valueType )
    const confirm = Statement.confirmParams(statement, paramValues, paramCount, paramCount, paramTypes)
    if (confirm.error) { return confirm }

    const initialValues = {}
    for (let idx = 0; idx < paramCount; idx++) {
      initialValues[statement.parameters[idx]] = paramValues[idx]
    }
    const executionId = machine.execution.startExecution(localVariables, initialValues)
    const value = interpreter.interpretExpression(statement.expression)
    // end execution before processing value, even if error
    const result = machine.execution.endExecution(executionId)
    if (result.error) { return result }
f
    if (value.error) { return value }
    if (value.valueType !== statement.valueType) {
      return error(ErrorCodes.TYPE_MISMATCH, statement.expression.tokenStart, statement.expression.tokenEnd)
    }
    return value
  }
}
