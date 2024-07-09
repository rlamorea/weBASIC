import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import {assertFloat, sendKey, runProgram, compareTestString } from './testHelpers.js'

import MockMachine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new MockMachine({ addScreen: true })
const inter = new Interpreter(machine)

test('basic for loop', async () => {
  const testCode = 'for a=0 to 5:b=b+1:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 6)
  assert.is(machine.variables.variableLookup['a'].value, 6)
})

test('basic for loop with step', async () => {
  const testCode = 'b=0:for a=0 to 10 step 2:b=b+a:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 30)
  assert.is(machine.variables.variableLookup['a'].value, 12)
})

test('basic for loop with negative step', async () => {
  const testCode = 'b=0:for a=10 to 0 step -1:b=b+a:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 55)
  assert.is(machine.variables.variableLookup['a'].value, -1)
})

test('nested for loop no next vars', async() => {
  const testCode = 'for a=0 to 3:for b=8 to 10:c=c+a+b:next:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['c'].value, 126)
  assert.is(machine.variables.variableLookup['b'].value, 11)
  assert.is(machine.variables.variableLookup['a'].value, 4)
})

test('nested for loop no next vars', async() => {
  const testCode = 'c=0:for a=0 to 3:for b=8 to 10:c=c+a+b:next b:next a'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['c'].value, 126)
  assert.is(machine.variables.variableLookup['b'].value, 11)
  assert.is(machine.variables.variableLookup['a'].value, 4)
})

test('integer index for loop', async () => {
  const testCode = 'b=0:for a%=0.7 to 5.5:b=b+a%:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 15)
  assert.is(machine.variables.variableLookup['a%'].value, 6)
})

test('integer index for loop with step', async () => {
  const testCode = 'b=0:for a%=0 to 10 step 2.5:b=b+a%:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 30)
  assert.is(machine.variables.variableLookup['a%'].value, 12)
})

test('float step', async () => {
  const testCode = 'b=0:for n=0.5 to 3.2 step 0.75:b=b+n:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 6.5)
  assert.is(machine.variables.variableLookup['n'].value, 3.5)
})

test('negative float step', async () => {
  const testCode = 'b=0:for n=3.2 to 0.5 step -0.75:b=b+n:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b'].value, 8.3)
  assertFloat(machine.variables.variableLookup['n'].value, 0.2)
})

// errors:
test('next without for', async () => {
  const testCode = 'b=0:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, ErrorCodes.UNEXPECTED_NEXT)
})

test('next var without for', async() => {
  const testCode = 'b=0:for a=1 to 10:b=b+1:next n'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, ErrorCodes.UNEXPECTED_NEXT)
})

test('string index', async () => {
  const testCode = 'for h$=5 to 10:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, ErrorCodes.TYPE_MISMATCH)
})

// breakable infinite for loop
test('break infinite loop', async () => {
  sendKey(machine, 'Escape', 25)
  const testCode = 'for x=1 to 2 step 0:next'
  const result = await machine.runLiveCode(testCode)

  assert.is(result.error, ErrorCodes.BREAK)
})

test('multiple line loop', async () => {
  const result = await runProgram(machine, [
    '10 FOR x = 1 to 5',
    '20 PRINT x;',
    '30 NEXT'
  ])

  assert.is(result.error, undefined)
  compareTestString('12345', machine.screenCells, 0, 40)
})

test.run()