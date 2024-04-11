import nextToken from './tokenizer.js'
import { displayString } from './fixedscreen.js'

export default class Interpreter {
  constructor(options) {
    this.screen = options.screen || {}
    this.machine = options.machine || {}

    this.handlers = {
      'statement|PRINT' : this.doPrint
    }
  }

  interpretCode(code) {
    code = code || []
    const codeLines = Array.isArray(code) ? code : [ code ]
    for (const codeLine of codeLines) {
      const lineResult = this.interpretLine(codeLine)
      if (lineResult.error) return lineResult
    }
    return { success: true }
  }

  interpretLine(codeLine) {
    // parse line to first end-of-statement
    let statementTokens = []
    let tokenDef = nextToken(codeLine, 0)
    while (1 === 1) {
      if (tokenDef.error) {
        return { error: tokenDef.error, location: tokenDef.tokenStart, endLocation: tokenDef.tokenEnd }
      }
      if (tokenDef.coding === 'end-of-statement') {
        const result = this.interpretStatement(statementTokens)
        if (result.error) { return result }
        statementTokens = []
      } else {
        statementTokens.push(tokenDef)
      }
      if (tokenDef.restOfLine === null) {
        return { success: true }
      }
      tokenDef = nextToken(tokenDef.restOfLine, tokenDef.tokenEnd)
    }
  }

  interpretStatement(statementTokens) {
    if (statementTokens.length === 0) return
    const firstToken = statementTokens.shift()
    const handler = this.handlers[`${firstToken.coding}|${firstToken.token}`]
    if (handler) {
      return handler(this.screen, this.cursorLocation, this.machine, statementTokens)
    } else {
      return { error: `Unknown ${firstToken.token}`, location: firstToken.tokenStart }
    }
  }

  doPrint(screen, cursorLocation, machine, tokens) {
    let stringToDisplay = ''
    for (const tokenDef of tokens) {
      if (tokenDef.coding === 'string-literal') {
        stringToDisplay += tokenDef.token
      } else {
        return { error: 'Bad Syntax', location: tokenDef.tokenStart, endLocation: tokenDef.tokenEnd }
      }
    }
    screen.displayStringAtCursor(stringToDisplay)
    return { success: true }
  }
}
