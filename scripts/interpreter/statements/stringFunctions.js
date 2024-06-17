import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

export default class StringFunctions extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
    }
    this.interpreterHandlers = {
      'function|LEN' : this.doLEN,
      'function|CHARAT$': this.doCHARAT,
      'function|LEFT$': this.doLEFT,
      'function|RIGHT$': this.doRIGHT,
      'function|MID$': this.doMID,
      'function|ASC': this.doASC,
      'function|CHR$': this.doCHR,
      'function|VAL': this.doVAL,
    }
  }

  doLEN(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'string' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, paramValues[0].value.length)
  }

  doCHARAT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const index = paramValues[1].value
    const str = paramValues[0].value
    if (index < 1 || index > str.length) { return error(ErrorCodes.ILLEGAL_INDEX, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    return Statement.strReturn(statement, paramValues[0].value[index - 1])
  }

  doLEFT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const len = paramValues[1].value
    if (len < 0) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    const str = paramValues[0].value
    let result = str
    if (len < str.length) { result = str.substring(0, len) }
    return Statement.strReturn(statement, result)
  }

  doRIGHT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const len = paramValues[1].value
    if (len < 0) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    const str = paramValues[0].value
    let result = str
    if (len < str.length) { result = str.substring(str.length - len) }
    return Statement.strReturn(statement, result)
  }

  doMID(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 3, [ 'string', 'number', 'number' ])
    if (confirm.error) { return confirm }
    const midStart = paramValues[1].value
    const str = paramValues[0].value
    const midEnd = paramValues[2]?.value || str.length
    if (midStart < 1) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    if (midEnd < 1) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[2].tokenStart, statement.parameters[2].tokenEnd) }
    let result = str
    if (midStart > str.length) {
      result = ''
    } else {
      result = str.substring(midStart - 1, midEnd)
    }
    return Statement.strReturn(statement, result)
  }

  doASC(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'string' ])
    if (confirm.error) { return confirm }
    let result = 0
    if (paramValues[0].value.length > 0) {
      result = paramValues[0].value.charCodeAt(0)
    }
    return Statement.valReturn(statement, result)
  }

  doCHR(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.strReturn(statement, String.fromCharCode(paramValues[0].value))
  }

  doVAL(machine, statement, paramValues, interpreter) {
    
  }
}
