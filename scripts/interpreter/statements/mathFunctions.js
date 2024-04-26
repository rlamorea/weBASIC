import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

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

  doABS(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.abs(paramValues[0].value))
  }

  doATN(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.atan(paramValues[0].value))
  }

  doCOS(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.cos(paramValues[0].value))
  }

  doEXP(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.exp(paramValues[0].value))
  }

  doINT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.trunc(paramValues[0].value))
  }

  doLOG(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.log(paramValues[0].value))
  }

  doRND(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 0, 2, [ 'number', 'number' ])
    if (confirm.error) { return confirm }
    let val = Math.random()
    if (paramValues.length > 0) {
      let range = paramValues.slice(-1)[0].value
      const minVal = paramValues.length === 1 ? 1 : paramValues[0].value
      range -= (minVal - 1)
      let v2 = Math.trunc(range*val ) + minVal
      val = v2
    }
    return Statement.valReturn(statement, val)
  }

  doSIN(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.sin(paramValues[0].value))
  }

  doSQR(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.sqrt(paramValues[0].value))
  }

  doTAN(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, Math.tan(paramValues[0].value))
  }
}
