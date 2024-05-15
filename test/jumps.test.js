import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import { runProgram } from "./testHelpers.js";

import MockMachine from './mockMachine.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

const machine = new MockMachine({ addScreen: true })
const lexifier = new Lexifier()

test('GOTO a line', async () => {
  const result = await runProgram(machine, [
    '10 a=1:GOTO 30',
    '20 a=2',
    '30 PRINT a'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '1')
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('GOTO unknown line', async() => {
  const result = await runProgram(machine, [
    '10 a=1:GOTO 30',
    '20 a=2'
  ])

  assert.is(result.error, ErrorCodes.UNKNOWN_LINE + ' 30')
})

test('GOSUB/RETURN', async() => {
  const result = await runProgram(machine, [
    '10 a=1:GOSUB 100',
    '20 a=2:GOSUB 100',
    '30 END',
    '100 PRINT a',
    '110 RETURN'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '1')
  assert.is(machine.screenCells[40].innerHTML, '2')
})

test('nested GOSUB', async () => {
  const result = await runProgram(machine, [
    '10 a=2:GOSUB 100',
    '20 a=3:GOSUB 100',
    '30 END',
    '100 b=a*a:GOSUB 200:RETURN',
    '200 PRINT b:RETURN'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '4')
  assert.is(machine.screenCells[40].innerHTML, '9')
})

test('naked RETURN', async () => {
  const result = await runProgram(machine, [
    '10 a=2:GOSUB 100',
    '100 PRINT a:RETURN'
  ])

  assert.is(result.error, ErrorCodes.UNEXPECTED_RETURN)
  assert.is(machine.screenCells[0].innerHTML, '2')
})

test.run()