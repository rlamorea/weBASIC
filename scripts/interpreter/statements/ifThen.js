import Statement from './statement.js'
import { ErrorCodes, error } from "../errors.js";

export default class IfThen extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|IF' : this.parseIfThen,
      'statement|ELSE' : this.parseElse,
    }
    this.interpreterHandlers = {
      'statement|IF' : this.doIfThen,
      'statement|ELSE' : this.doElse,
    }
  }

  parseIfThen(statement, tokens, lexifier) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    let conditionTokens = []
    while (tokens.length > 0) {
      let token = tokens.shift()
      if (token.coding === 'keyword' && token.token === 'THEN') {
        if (conditionTokens.length === 0) {
          return error(ErrorCodes.SYNTAX, statement.tokenStart, token.tokenEnd)
        }
        const condition = lexifier.parseExpression(conditionTokens, conditionTokens[0].tokenStart)
        if (condition.error) { return condition }
        statement.condition = condition
        if (tokens.length > 0) {
          // TODO: eventually need to deal with labels
          if (tokens[0].coding === 'number-literal') {
            const goLine = tokens.shift()
            if (tokens.length > 0) {
              return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd)
            }
            const goLineNumber = parseInt(goLine.token)
            if (isNaN(goLineNumber) || !isFinite(goLineNumber)) {
              return error(ErrorCodes.UNKNOWN_LINE, goLine.tokenStart, goLine.tokenEnd)
            }
            statement.conditionalGotoLine = goLineNumber
          } else {
            const conditionalStatement = lexifier.lexifyStatement(tokens)
            if (conditionalStatement.error) { return conditionalStatement }
            statement.conditionalStatement = conditionalStatement
            tokens = []
          }
        }
      } else {
        conditionTokens.push(token)
      }
    }
    return statement
  }

  parseElse(statement, tokens, lexifier) {
    const conditionalStatement = lexifier.lexifyStatement(tokens)
    if (conditionalStatement.error) { return conditionalStatement }

    statement.conditionalStatement = conditionalStatement
    return statement
  }

  async doIfThen(machine, statement, interpreter) {
    const conditionValue = interpreter.interpretExpression(statement.condition)
    if (conditionValue.error) { return conditionValue }
    if (conditionValue.valueType !== 'number') {
      return error(ErrorCodes.TYPE_MISMATCH, statement.condition.tokenStart, statement.condition.tokenEnd)
    }
    machine.execution.setActiveIfCondition(machine.execution.currentCodespace, conditionValue.value !== 0)
    if (conditionValue.value === 0) {
      machine.execution.setExecutionSkip(machine.execution.currentCodespace,[ 'eol', 'statement|ELSE' ])
      return { done: true }
    } else if (statement.conditionalGotoLine) {
      return { done: true, redirectLine: statement.conditionalGotoLine }
    } else if (statement.conditionalStatement) {
      const result = await interpreter.interpretStatement(statement.conditionalStatement)
      if (result.error) { return result }
    }

    return { done: true }
  }

  async doElse(machine, statement, interpreter) {
    const activeCondition = machine.execution.getActiveIfCondition(machine.execution.currentCodespace)
    if (activeCondition === null) {
      return error(ErrorCodes.UNEXPECTED_ELSE, statement.tokenStart, statement.tokenEnd)
    }
    if (activeCondition === true) {
      machine.execution.setExecutionSkip(machine.execution.currentCodespace,'eol')
    } else if (statement.conditionalStatement.coding !== 'empty') {
      const result = await interpreter.interpretStatement(statement.conditionalStatement)
      if (result.error) { return result}
    }

    return { done: true }
  }
}
