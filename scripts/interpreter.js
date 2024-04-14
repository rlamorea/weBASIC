import Lexifier from './lexifier.js'
import * as Statements from './statements/statements.js'

export default class Interpreter {
  constructor(options) {
    this.screen = options.screen || {}
    this.machine = options.machine || {}

    this.lexifier = new Lexifier()

    this.handlers = {}
    for (const statement in Statements) {
      Statements[statement].addInterpreterHandlers(this.handlers)
    }
  }

  interpretLine(codeLine) {
    let lineStatements = this.lexifier.lexifyLine(codeLine)
    if (lineStatements.error) return { lineStatements }

    for (const statement of lineStatements.lineStatements) {
      const result = this.interpretStatement(statement)
      if (result.error) { return result }
    }
    return { done: true }
  }

  interpretStatement(statement) {
    const key = `${statement.statement.coding}|${statement.statement.token}`
    const handler = this.handlers[key]
    if (handler) {
      return handler(this.screen, this.machine, statement.parameters)
    } else {
      return {
        error: `Unknown Statement ${statement.statement.token}`,
        location: statement.statement.tokenStart,
        endLocation: statement.statement.tokenEnd
      }
    }
  }
}
