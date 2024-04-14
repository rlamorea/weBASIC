function addHandlers(handlers, toAdd) {
  for (const handler in toAdd) {
    handlers[handler] = toAdd[handler]
  }
}

export default class Statement {
  constructor() {
    this.lexicalHandlers = {}
    this.interpreterHandlers = {}
  }

  addLexicalHandlers(handlers) {
    addHandlers(handlers, this.lexicalHandlers)
  }

  addInterpreterHandlers(handlers) {
    addHandlers(handlers, this.interpreterHandlers)
  }
}