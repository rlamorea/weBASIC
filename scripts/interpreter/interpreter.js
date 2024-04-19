import Lexifier from './lexifier.js'
import * as Statements from './statements/statements.js'

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
      return handler(this.machine, statement)
    } else {
      return {
        error: `Unknown ${statement.token || statement.coding}`,
        location: statement.tokenStart,
        endLocation: statement.tokenEnd
      }
    }
  }
}
