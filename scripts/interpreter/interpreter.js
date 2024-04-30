import Lexifier from './lexifier.js'
import * as Statements from './statements/statements.js'
import { unaryOperation, binaryOperation } from "./statements/operators.js";
import { ErrorCodes, error } from './errors.js'

export default class Interpreter {
  constructor(machine, options) {
    this.machine = machine
    this.lexifier = new Lexifier()

    this.handlers = {}
    for (const statement in Statements) {
      Statements[statement].addInterpreterHandlers(this.handlers)
    }
  }

  prepLine(codeLine, allowLineNumbers, acceptedList) {
    return this.lexifier.lexifyLine(codeLine, allowLineNumbers, acceptedList)
  }

  async interpretLine(codeLine) {
    return await this.machine.runLiveCode(codeLine)
  }

  async interpretStatement(statement) {
    // look for specific handler first
    let key = `${statement.coding}|${statement.token}`
    let handler = this.handlers[key]
    if (!handler) {
      // then generic handler
      key = `${statement.coding}*`
      handler = this.handlers[key]
    }
    if (handler) {
      try {
        return await handler(this.machine, statement, this)
      } catch (e) {
        if (e.error) { return e }
        console.log(e.stack)
        return error(e.toString(), statement.tokenStart, statement.tokenEnd)
      }
    } else {
      return {
        error: `Unknown ${statement.token || statement.coding}`,
        location: statement.tokenStart,
        endLocation: statement.tokenEnd
      }
    }
  }

  interpretExpression(statement) {
    let value = null
    switch (statement.coding) {
      case 'variable-string':
        value = this.machine.variables.getValue(statement, this)
        break
      case 'string-literal':
        value = { value: statement.token, valueType: 'string' }
        break
      case 'number-literal':
        if (statement.token.startsWith('.')) { statement.token = '0' + statement.token }
        value = { value: parseFloat(statement.token), valueType: 'number' }
        if (isNaN(value.value) || !isFinite(value.value)) {
          return error(ErrorCodes.ILLEGAL_VALUE, statement.tokenStart, statement.tokenEnd)
        }
        break
      case 'variable-number':
      case 'variable-integer':
        value = this.machine.variables.getValue(statement, this)
        break
      case 'calculation':
        value = binaryOperation(statement.operator, statement.pre, statement.post, this)
        if (value.error) { return value }
        break
      case 'function':
        let paramValues = []
        for (const parameter of statement.parameters) {
          const paramValue = this.interpretExpression(parameter)
          if (paramValue.error) { return paramValue }
          paramValues.push(paramValue)
        }
        const handler = this.handlers[`${statement.function.coding}|${statement.function.token}`]
        if (!handler) {
          return error(ErrorCodes.UNSUPPORTED, statement.tokenStart, statement.tokenEnd)
        }
        value = handler(this.machine, statement, paramValues, this)
        break
      default:
        return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    // fall through means we have a number value, time to check for unary negation
    if (statement.unaryOperator) {
      value = unaryOperation(statement.unaryOperator, value, statement.tokenStart, statement.tokenEnd)
      if (value.error) { return value }
    }
    return value
  }

  convertValue(valueDef, asType, tokenStart, tokenEnd) {
    if (asType === 'character' && valueDef.valueType === 'string') {
      valueDef.value = (valueDef.value.length === 0) ? '\0' : valueDef.value[0]
    } else if (asType === 'integer' && valueDef.valueType === 'number') {
      valueDef.value = Math.trunc(valueDef.value)
    } else if (asType !== valueDef.valueType) {
      return error(ErrorCodes.TYPE_MISMATCH, tokenStart, tokenEnd)
    }
    return valueDef
  }
}
