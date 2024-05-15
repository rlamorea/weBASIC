import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import MockMachine from './mockMachine.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

const machine = new MockMachine({ addScreen: true })
const lexifier = new Lexifier()

async function runProgram(codeLines) {
  machine.execution.resetCodespaceToNew(machine.runCodespace)
  machine.variables.clearAll()
  for (const codeLine of codeLines) {
    machine.execution.addCodeLine(machine.runCodespace,-1, codeLine)
  }
  return await machine.execution.runCode(machine.runCodespace)
}

test('parsing DATA with one number', () => {
  const result = lexifier.lexifyLine('10 DATA 5', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 1)
  assert.is(statement.dataValues[0].valueType, 'number')
  assert.is(statement.dataValues[0].value, 5)
})

test('parsing DATA with two numbers', () => {
  const result = lexifier.lexifyLine('10 DATA 5, 6', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 2)
  assert.is(statement.dataValues[0].valueType, 'number')
  assert.is(statement.dataValues[0].value, 5)
  assert.is(statement.dataValues[1].valueType, 'number')
  assert.is(statement.dataValues[1].value, 6)
})

test('parsing DATA with one string literal', () => {
  const result = lexifier.lexifyLine('10 DATA "hello"', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 1)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello')
})

test('parsing DATA with two string literals', () => {
  const result = lexifier.lexifyLine('10 DATA "hello", "world"', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 2)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello')
  assert.is(statement.dataValues[1].valueType, 'string')
  assert.is(statement.dataValues[1].value, 'world')
})

test('parsing DATA with unquoted string', () => {
  const result = lexifier.lexifyLine('10 DATA hello', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 1)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello')
})

test('parsing DATA with two unquoted strings', () => {
  const result = lexifier.lexifyLine('10 DATA hello, world', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 2)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello')
  assert.is(statement.dataValues[1].valueType, 'string')
  assert.is(statement.dataValues[1].value, 'world')
})

test('parsing DATA with extended unquoted string', () => {
  const result = lexifier.lexifyLine('10 DATA hello + world', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 1)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello + world')
})

test('parsing DATA with two extended unquoted strings', () => {
  const result = lexifier.lexifyLine('10 DATA hello + world, foo - bar', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 2)
  assert.is(statement.dataValues[0].valueType, 'string')
  assert.is(statement.dataValues[0].value, 'hello + world')
  assert.is(statement.dataValues[1].valueType, 'string')
  assert.is(statement.dataValues[1].value, 'foo - bar')
})

test('parsing DATA with no values', () => {
  const result = lexifier.lexifyLine('10 DATA ', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 0)
})

test('parsing DATA with mixed values', () => {
  const result = lexifier.lexifyLine('10 DATA 5, "hello", world!', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.dataValues.length, 3)
  assert.is(statement.dataValues[0].valueType, 'number')
  assert.is(statement.dataValues[0].value, 5)
  assert.is(statement.dataValues[1].valueType, 'string')
  assert.is(statement.dataValues[1].value, 'hello')
  assert.is(statement.dataValues[2].valueType, 'string')
  assert.is(statement.dataValues[2].value, 'world!')
})


test('parsing READ with one number variable', () => {
  const result = lexifier.lexifyLine('10 READ a', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.readVariables.length, 1)
  assert.is(statement.readVariables[0].coding, 'variable-number')
  assert.is(statement.readVariables[0].token, 'a')
})

test('parsing READ with two number variables', () => {
  const result = lexifier.lexifyLine('10 READ a, b', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.readVariables.length, 2)
  assert.is(statement.readVariables[0].coding, 'variable-number')
  assert.is(statement.readVariables[0].token, 'a')
  assert.is(statement.readVariables[1].coding, 'variable-number')
  assert.is(statement.readVariables[1].token, 'b')
})

test('parsing READ with two string variables', () => {
  const result = lexifier.lexifyLine('10 READ a$, b$', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.readVariables.length, 2)
  assert.is(statement.readVariables[0].coding, 'variable-string')
  assert.is(statement.readVariables[0].token, 'a$')
  assert.is(statement.readVariables[1].coding, 'variable-string')
  assert.is(statement.readVariables[1].token, 'b$')
})

test('parsing READ with mixed variables', () => {
  const result = lexifier.lexifyLine('10 READ a$, b%, c', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.readVariables.length, 3)
  assert.is(statement.readVariables[0].coding, 'variable-string')
  assert.is(statement.readVariables[0].token, 'a$')
  assert.is(statement.readVariables[1].coding, 'variable-integer')
  assert.is(statement.readVariables[1].token, 'b%')
  assert.is(statement.readVariables[2].coding, 'variable-number')
  assert.is(statement.readVariables[2].token, 'c')
})

test('parsing READ with no variables - error', () => {
  const result = lexifier.lexifyLine('10 READ', true)

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('parsing RESTORE with no line number', () => {
  const result = lexifier.lexifyLine('10 RESTORE', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.restoreLineNumber, undefined)
})

test('parsing RESTORE with a line number', () => {
  const result = lexifier.lexifyLine('10 RESTORE 20', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
  const statement = result.lineStatements[0]
  assert.is(statement.restoreLineNumber, 20)
})

test('parsing RESTORE with bad line number', () => {
  const result = lexifier.lexifyLine('10 RESTORE foo', true)

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('parsing RESTORE with more than line number', () => {
  const result = lexifier.lexifyLine('10 RESTORE 10,foo', true)

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('single DATA value into dataset', async () => {
  const result = await runProgram([ '10 DATA 5' ])

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.dataLines.length, 1)
  assert.is(machine.runCodespace.dataLines[0], 10)
  assert.is(machine.runCodespace.dataStatements[10].length, 1)
  assert.is(machine.runCodespace.dataStatements[10][0].valueType, 'number')
  assert.is(machine.runCodespace.dataStatements[10][0].value, 5)
})

test('multiple DATA values into dataset', async () => {
  const result = await runProgram([ '10 DATA 5, "hello", foo + bar' ])

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.dataLines.length, 1)
  assert.is(machine.runCodespace.dataLines[0], 10)
  assert.is(machine.runCodespace.dataStatements[10].length, 3)
  assert.is(machine.runCodespace.dataStatements[10][0].valueType, 'number')
  assert.is(machine.runCodespace.dataStatements[10][0].value, 5)
  assert.is(machine.runCodespace.dataStatements[10][1].valueType, 'string')
  assert.is(machine.runCodespace.dataStatements[10][1].value, 'hello')
  assert.is(machine.runCodespace.dataStatements[10][2].valueType, 'string')
  assert.is(machine.runCodespace.dataStatements[10][2].value, 'foo + bar')
})

test('multiple DATA lines into dataset', async () => {
  const result = await runProgram([ '10 DATA 5', '20 DATA hello' ])

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.dataLines.length, 2)
  assert.is(machine.runCodespace.dataLines[0], 10)
  assert.is(machine.runCodespace.dataLines[1], 20)
  assert.is(machine.runCodespace.dataStatements[10].length, 1)
  assert.is(machine.runCodespace.dataStatements[10][0].valueType, 'number')
  assert.is(machine.runCodespace.dataStatements[10][0].value, 5)
  assert.is(machine.runCodespace.dataStatements[20].length, 1)
  assert.is(machine.runCodespace.dataStatements[20][0].valueType, 'string')
  assert.is(machine.runCodespace.dataStatements[20][0].value, 'hello')
})

test('multiple DATA statements in one line into dataset', async () => {
  const result = await runProgram([ '10 DATA 5:DATA "hello"' ])

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.dataLines.length, 1)
  assert.is(machine.runCodespace.dataLines[0], 10)
  assert.is(machine.runCodespace.dataStatements[10].length, 2)
  assert.is(machine.runCodespace.dataStatements[10][0].valueType, 'number')
  assert.is(machine.runCodespace.dataStatements[10][0].value, 5)
  assert.is(machine.runCodespace.dataStatements[10][1].valueType, 'string')
  assert.is(machine.runCodespace.dataStatements[10][1].value, 'hello')
})

test('READ one number', async () => {
  const result = await runProgram([ '10 DATA 5', '20 READ a' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
})

test('READ one number from string - error', async () => {
  const result = await runProgram([ '10 DATA hello', '20 READ a' ])

  assert.is(result.error, ErrorCodes.TYPE_MISMATCH)
})

test('READ one integer', async () => {
  const result = await runProgram([ '10 DATA 5.5', '20 READ a%' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a%'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a%'].value, 5)
})

test('READ one string', async () => {
  const result = await runProgram([ '10 DATA hello', '20 READ a$' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a$'].valueType, 'string')
  assert.is(machine.variables.variableLookup['a$'].value, 'hello')
})

test('READ one string from number', async () => {
  const result = await runProgram([ '10 DATA 5.5', '20 READ a$' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a$'].valueType, 'string')
  assert.is(machine.variables.variableLookup['a$'].value, '5.5')
})

test('READ one number no data - error', async () => {
  const result = await runProgram([ '20 READ a%' ])

  assert.is(result.error, ErrorCodes.OUT_OF_DATA)
})

test('READ two numbers', async () => {
  const result = await runProgram([ '10 DATA 5, 10', '20 READ a, b' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
  assert.is(machine.variables.variableLookup['b'].valueType, 'number')
  assert.is(machine.variables.variableLookup['b'].value, 10)
})

test('READ a number and a string', async () => {
  const result = await runProgram([ '10 DATA 5, hello', '20 READ a, b$' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
  assert.is(machine.variables.variableLookup['b$'].valueType, 'string')
  assert.is(machine.variables.variableLookup['b$'].value, 'hello')
})

test('READ two numbers from two lines', async () => {
  const result = await runProgram([ '10 READ a, b', '20 DATA 5', '30 DATA 10' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
  assert.is(machine.variables.variableLookup['b'].valueType, 'number')
  assert.is(machine.variables.variableLookup['b'].value, 10)
})

test('READ two numbers one value - error', async () => {
  const result = await runProgram([ '10 READ a, b', '20 DATA 5' ])

  assert.is(result.error, ErrorCodes.OUT_OF_DATA)
})

test('READ three numbers from two lines - error', async () => {
  const result = await runProgram([ '10 READ a, b, c', '20 DATA 5', '30 DATA 10' ])

  assert.is(result.error, ErrorCodes.OUT_OF_DATA)
})

test ('READ in loop', async () => {
  const result = await runProgram([
    '10 FOR i = 1 TO 5:READ a$:PRINT a$:NEXT',
    '20 DATA h, e, l, l, o'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'e')
  assert.is(machine.screenCells[80].innerHTML, 'l')
  assert.is(machine.screenCells[120].innerHTML, 'l')
  assert.is(machine.screenCells[160].innerHTML, 'o')
  assert.is(machine.screenCells[200].innerHTML, '')
})

test('READ, RESTORE, READ one value', async () => {
  const result = await runProgram([ '10 READ a:RESTORE:READ b', '20 DATA 5' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
  assert.is(machine.variables.variableLookup['b'].valueType, 'number')
  assert.is(machine.variables.variableLookup['b'].value, 5)
})

test('RESTORE invalid line - error', async () => {
  const result = await runProgram([ '10 READ a:RESTORE 30:READ b', '20 DATA 5' ])

  assert.is(result.error, ErrorCodes.UNKNOWN_LINE)
})

test('READ, READ, RESTORE line, READ', async () => {
  const result = await runProgram([
    '10 READ a: READ b:RESTORE 30:READ c',
    '20 DATA 5',
    '30 DATA 10'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 5)
  assert.is(machine.variables.variableLookup['b'].valueType, 'number')
  assert.is(machine.variables.variableLookup['b'].value, 10)
  assert.is(machine.variables.variableLookup['c'].valueType, 'number')
  assert.is(machine.variables.variableLookup['c'].value, 10)
})

test.run()