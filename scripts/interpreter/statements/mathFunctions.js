import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

function confirmParams(statement, paramValues, minimumCount, maximumCount, paramTypes) {
  if (paramValues.length < minimumCount || paramValues.length > maximumCount) {
    const errorStart = (paramValues.length === 0) ? statement.function.tokenStart : statement.parameters[0].tokenStart
    const errorEnd = (paramValues.length === 0) ? statement.function.tokenEnd : statement.parameters.slice(-1)[0].tokenEnd
    return error(ErrorCodes.SYNTAX, errorStart, errorEnd)
  }
  for (let idx = 0; idx < paramTypes.length; idx++) {
    if (idx >= paramValues.length) break
    if (paramValues[idx].valueType !== paramTypes[idx]) {
      return error(ErrorCodes.TYPE_MISMATCH, statement.parameters[idx].tokenStart, statement.parameters[idx].tokenEnd)
    }
  }
  return { success: true }
}

function valReturn(statement, value) {
  if (isNaN(value) || !isFinite(value)) {
    const errorStart = statement.parameters.length === 0 ? statement.function.tokenStart : statement.parameters[0].tokenStart
    const errorEnd = statement.parameters.length === 0 ? statement.function.tokenEnd : statement.parameters.slice(-1)[0].tokenEnd
    return error(ErrorCodes.ILLEGAL_VALUE, errorStart, errorEnd)
  }
  return { value, valueType: 'number' }
}

export default class MathFunctions extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
    }
    this.interpreterHandlers = {
      'function|ABS' : this.doABS,
      'function|ATN' : this.doATN,
      'function|COS' : this.doCOS,
      'function|EXP' : this.doEXP,
      'function|INT' : this.doINT,
      'function|LOG' : this.doLOG,
      'function|RND' : this.doRND,
      'function|SIN' : this.doSIN,
      'function|SQR' : this.doSQR,
      'function|TAN' : this.doTAN,
    }
  }

  doABS(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.abs(paramValues[0].value))
  }

  doATN(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.atan(paramValues[0].value))
  }

  doCOS(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.cos(paramValues[0].value))
  }

  doEXP(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.exp(paramValues[0].value))
  }

  doINT(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.trunc(paramValues[0].value))
  }

  doLOG(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.log(paramValues[0].value))
  }

  doRND(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 0, 2, [ 'number', 'number' ])
    if (confirm.error) { return confirm }
    let val = Math.random()
    if (paramValues.length > 0) {
      let range = paramValues.slice(-1)[0].value
      const minVal = paramValues.length === 1 ? 1 : paramValues[0].value
      range -= (minVal - 1)
      let v2 = Math.trunc(range*val ) + minVal
      val = v2
    }
    return valReturn(statement, val)
  }

  doSIN(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.sin(paramValues[0].value))
  }

  doSQR(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.sqrt(paramValues[0].value))
  }

  doTAN(statement, paramValues, lexifier) {
    const confirm = confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return valReturn(statement, Math.tan(paramValues[0].value))
  }
}
