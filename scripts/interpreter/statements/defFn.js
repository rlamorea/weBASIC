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
      return error(ErrorCodes.SYNTAX, functionName.tokenStart, functionName.tokenEnd)
    }
    const openParen = tokens.shift()
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, openParen.tokenStart, openParen.tokenEnd)}
    const parenTokens = lexifier.parseToCloseParen(tokens, tokens[0].tokenStart)
    if (parenTokens.error) { return parenTokens }
    if (parenTokens.parenTokens.length === 0) { return error(ErrorCodes.SYNTAX, openParen.tokenStart, parenTokens.closeParen.tokenEnd) }
    tokens = parenTokens.restOfTokens
    const tokenEnd = parenTokens.closeParen.tokenEnd
    const params = lexifier.parseIntoParameters(parenTokens.parenTokens, parenTokens.parenTokens[0].tokenStart)
    if (params.error) { return params }
    functionName.userFunction = true
    return { functionName, parameters: params.parameters, restOfTokens: tokens, tokenEnd }
  }

  parseDefFn(statement, tokens, lexifier) {
    if (tokens.length === 0) { return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd) }
    const fn = tokens.shift()
    if (fn.coding !== 'function' || fn.token !== 'FN') {
      return error(ErrorCodes.SYNTAX, fn.tokenStart, fn.tokenEnd)
    }
    const result = DefFn.parseFnNameAndParams(tokens, lexifier)
    if (result.error) { return result }
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, result.tokenEnd)
    }
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
      functionName: result.functionName,
      parameters: result.parameters,
      valueType: result.functionName.valueType,
      tokenStart: statement.tokenStart,
      tokenEnd: result.tokenEnd,
      restOfTokens: result.restOfTokens
    }
  }

  doDefFn(machine, statement, interpreter) {
    const functionName = statement.functionName
    if (machine.variables.getRawValue(functionName.token)) {
      return error(ErrorCodes.ILLEGAL_REASSIGN, statement.tokenStart, statement.tokenEnd)
    }
    const valueDef = {
      value: statement,
      valueType: 'function'
    }
    const result = machine.variables.setValue(functionName, valueDef, interpreter)
    if (result.error) { return result }

    return { done: true }
  }

  doFn(machine, statement, paramValues, interpreter) {
    // look up the instruction
    const userFunction = machine.variables.getRawValue(statement.functionName.token)
    if (!userFunction || userFunction.valueType !== 'function') {
      return error(ErrorCodes.UNDEF_FUNCTION, statement.tokenStart, statement.tokenEnd)
    }

    const paramCount = userFunction.value.parameters.length
    const paramTypes = userFunction.value.parameters.map((x) => x.valueType )
    const confirm = Statement.confirmParams(statement, paramValues, paramCount, paramCount, paramTypes)
    if (confirm.error) { return confirm }

    const initialValues = {}
    for (let idx = 0; idx < paramCount; idx++) {
      initialValues[userFunction.value.parameters[idx].token] = paramValues[idx]
    }
    const executionId = machine.execution.startExecution(userFunction.value.parameters, initialValues)
    const value = interpreter.interpretExpression(userFunction.value.expression)
    // end execution before processing value, even if error
    const result = machine.execution.endExecution(executionId)
    if (result.error) { return result }

    if (value.error) { return value }
    if (value.valueType !== statement.valueType) {
      return error(ErrorCodes.TYPE_MISMATCH, statement.expression.tokenStart, statement.expression.tokenEnd)
    }
    if (userFunction.value.functionName.coding === 'variable-integer') {
      value.value = Math.trunc(value.value)
    }
    return value
  }
}
