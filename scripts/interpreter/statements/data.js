import Statement from './statement.js'
import { ErrorCodes, error, errorat } from '../errors.js'

function parseDataStatements(machine) {
  // scan the code for data statements and capture all of the data
  let dataLines = []
  for (const lineNumber of machine.runCodespace.lineNumbers) {
    const line = machine.runCodespace.codeLines[lineNumber]
    if (line.error) { return line.error }
    let lineData = []
    for (const statement of line.statements) {
      if (statement.coding === 'statement' && statement.token === 'DATA' && statement.dataValues.length > 0) {
        lineData = [ ...lineData, ...statement.dataValues ]
      }
    }
    if (lineData.length > 0) {
      dataLines.push(lineNumber)
      machine.runCodespace.dataStatements[lineNumber] = lineData
    }
  }
  if (dataLines.length === 0) {
    // insert an invalid line to mark that we parsed the code
    machine.runCodespace.dataStatements[-1] = []
  }
  machine.runCodespace.dataLines = dataLines
  machine.runCodespace.dataIndex.lineIndex = dataLines.length > 0 ? 0 : -1
  machine.runCodespace.dataIndex.valueIndex = -1
  return { done: true }
}

export default class Data extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'statement|DATA': this.parseData,
      'statement|READ': this.parseRead,
      'statement|RESTORE': this.parseRestore
    }
    this.interpreterHandlers = {
      'statement|DATA': this.doData,
      'statement|READ': this.doRead,
      'statement|RESTORE': this.doRestore
    }
  }

  parseData(statement, tokens, lexifier) {
    if (statement.lineNumber === null) {
      return error(ErrorCodes.NOT_ALLOWED, statement.tokenStart, statement.tokenEnd)
    }
    let dataValues = []
    if (tokens.length > 0) {
      const params = lexifier.parseIntoParameters(tokens, tokens[0].tokenStart, true)
      if (params.error) { return params }
      for (const paramTokens of params.parameters) {
        let dataValue = { value: '', valueType: 'string' }
        if (paramTokens.length === 1 && paramTokens[0].coding === 'number-literal') {
          dataValue.value = parseFloat(paramTokens[0].token)
          dataValue.valueType = 'number'
          if (isNaN(dataValue.value) || !isFinite(dataValue.value)) {
            dataValue.value = paramTokens[0].token
            dataValue.valueType = 'string'
          }
        } else if (paramTokens.length === 1 && paramTokens[0].coding === 'string-literal') {
          dataValue.value = paramTokens[0].token
        } else if (paramTokens.length > 0) {
          dataValue.value = paramTokens[0].token
          const commaIdx = paramTokens[0].restOfLine.indexOf(',')
          if (commaIdx >= 0) {
            dataValue.value += paramTokens[0].restOfLine.substring(0, commaIdx)
          } else {
            dataValue.value += paramTokens[0].restOfLine
          }
          dataValue.value = dataValue.value.trim()
        }
        dataValues.push(dataValue)
      }
    }
    statement.dataValues = dataValues
    return statement
  }

  parseRead(statement, tokens, lexifier) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
    }
    let variables = []
    while (1 === 1) {
      if (tokens.length === 0) { break }
      const token = tokens.shift()
      if (!token.coding.startsWith('variable-')) {
        return error(ErrorCodes.SYNTAX, token.tokenStart, token.tokenEnd)
      }
      variables.push(token)
      if (tokens.length > 0) {
        const comma = tokens.shift()
        if (comma.coding !== 'comma') {
          return error(ErrorCodes.SYNTAX, comma.tokenStart, comma.tokenEnd)
        }
      }
    }
    statement.readVariables = variables
    return statement
  }

  parseRestore(statement, tokens, lexifier) {
    // TODO: support labels later
    if (tokens.length > 0) {
      const lineNumberToken = tokens.shift()
      if (lineNumberToken.coding !== 'number-literal') {
        return error(ErrorCodes.SYNTAX, lineNumberToken.tokenStart, lineNumberToken.tokenEnd)
      }
      const lineNumber = parseInt(lineNumberToken.token)
      if (isNaN(lineNumber) || !isFinite(lineNumber)) {
        return error(ErrorCodes.UNKNOWN_LINE, lineNumberToken.tokenStart, lineNumberToken.tokenEnd)
      }
      statement.restoreLineNumber = lineNumber
    }
    if (tokens.length > 0) {
      return error(ErrorCodes.SYNTAX, tokens[0].tokenStart, tokens.slice(-1)[0].tokenEnd)
    }
    return statement
  }

  doData(machine, statement, interpreter) {
    if (Object.keys(machine.runCodespace.dataStatements).length === 0) {
      const result = parseDataStatements(machine)
      if (result.error) { return result }
    }
    return { done: true } // data does nothing during execution
  }

  doRead(machine, statement, interpreter) {
    if (Object.keys(machine.runCodespace.dataStatements).length === 0) {
      const result = parseDataStatements(machine)
      if (result.error) { return result }
    }
    if (machine.runCodespace.dataIndex.lineIndex < 0) {
      return error(ErrorCodes.OUT_OF_DATA, statement.tokenStart, statement.tokenEnd)
    }
    let index = machine.runCodespace.dataIndex
    const dataStatements = machine.runCodespace.dataStatements
    const dataLines = machine.runCodespace.dataLines
    let lineData = dataStatements[dataLines[index.lineIndex]]
    for (const variable of statement.readVariables) {
      index.valueIndex += 1
      if (index.valueIndex >= lineData.length) {
        index.lineIndex += 1
        index.valueIndex = 0
        if (index.lineIndex >= dataLines.length) {
          return error(ErrorCodes.OUT_OF_DATA, variable.tokenStart, variable.tokenEnd)
        }
        lineData = dataStatements[dataLines[index.lineIndex]]
      }
      let dataValue = lineData[index.valueIndex]
      if (variable.valueType === 'string' && dataValue.valueType === 'number') {
        dataValue = { value: dataValue.value.toString(), valueType: 'string' }
      } else if (variable.valueType === 'number' && dataValue.valueType === 'string') {
        return error(ErrorCodes.TYPE_MISMATCH, variable.tokenStart, variable.tokenEnd)
      }
      const result = machine.variables.setValue(variable, dataValue, interpreter)
      if (result.error) { return result }
    }

    return { done: true }
  }

  doRestore(machine, statement, interpreter) {
    if (Object.keys(machine.runCodespace.dataStatements).length === 0) {
      const result = parseDataStatements(machine)
      if (result.error) { return result }
    }
    // NOTE: RESTORE ignored if no DATA statements
    if (machine.runCodespace.dataIndex.lineIndex >= 0) {
      let lineIndex = 0
      if (statement.restoreLineNumber) {
        lineIndex = machine.runCodespace.dataLines.indexOf(statement.restoreLineNumber)
        if (lineIndex < 0) {
          return error(ErrorCodes.UNKNOWN_LINE, statement.tokenStart, statement.tokenEnd)
        }
      }
      machine.runCodespace.dataIndex.lineIndex = lineIndex
      machine.runCodespace.dataIndex.valueIndex = -1
    }
    return { done: true }
  }
}
