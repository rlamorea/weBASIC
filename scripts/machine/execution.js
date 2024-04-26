export default class Execution {
  constructor() {
    this.skipTo = null
  }

  setExecutionSkip(skipTo) {
    if (!Array.isArray(skipTo)) { skipTo = [ skipTo ] }
    this.skipTo = skipTo
  }

  skipExecution(statement) {
    if (!this.skipTo) return false
    let foundEnd = false
    if (statement === 'eol' && this.skipTo.indexOf('eol') >= 0) {
      foundEnd = true
    } else if (this.skipTo.indexOf(`${statement.coding}|${statement.token}`) >= 0) {
      foundEnd = true
    } // NOTE: this means we can only stop at a specific statement
    if (foundEnd) { this.skipTo = null }
    return !foundEnd
  }
}
