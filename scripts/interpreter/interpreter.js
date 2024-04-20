import Lexifier from './lexifier.js'
import * as Statements from './statements/statements.js'
import { unaryOperation, binaryOperation } from "./statements/operators.js";

export default class Interpreter {
  constructor(options) {
    this.machine = options.machine || {}

    this.lexifier = new Lexifier()

    this.handlers = {}
    for (const statement in Statements) {
      Statements[statement].addInterpreterHandlers(this.handlers)
    }
  }

  interpretLine(codeLine) {
    let lineStatements = this.lexifier.lexifyLine(codeLine)
    if (lineStatements.error) { return lineStatements }

    for (const statement of lineStatements.lineStatements) {
      const result = this.interpretStatement(statement)
      if (result.error) { return result }
    }
    return { done: true }
  }

  interpretStatement(statement) {
    // look for specific handler first
    let key = `${statement.coding}|${statement.token}`
    let handler = this.handlers[key]
    if (!handler) {
      // then generic handler
      key = `${statement.coding}*`
      handler = this.handlers[key]
    }
    if (handler) {
      return handler(this.machine, statement, this)
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
        value = { value: parseFloat(statement.token), valueType: 'number' }
        if (isNaN(value.value) || !isFinite(value.value)) {
          return { error: `Illegal Value ${statement.token}`, location: statement.tokenStart, endLocation: statement.tokenEnd }
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
          return { error: `Unknown ${statement.function.token}`, location: statement.tokenStart, endLocation: statement.tokenEnd }
        }
        value = handler(statement, paramValues, this)
        break
      default:
        return { error: 'Unknown Expression', location: statement.tokenStart, endLocation: statement.tokenEnd }
    }
    // fall through means we have a number value, time to check for unary negation
    if (statement.unaryOperator) {
      value = unaryOperation(statement.unaryOperator, value, statement.tokenStart, statement.tokenEnd)
      if (value.error) { return value }
    }
    return value
  }
}
