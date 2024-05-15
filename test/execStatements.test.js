import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import { addProgram, runProgram, runLiveCommand } from './testHelpers.js'

import MockMachine from './mockMachine.js'

const machine = new MockMachine({ addScreen: true })

test('run to END', async () => {
  const result = await runProgram(machine, [
    '10 a = 1',
    '20 PRINT "hello world"',
    '30 a = a + 1',
    '40 IF a <= 5 THEN 20',
    '50 END'
  ], 'RUN')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'h')
  assert.is(machine.screenCells[80].innerHTML, 'h')
  assert.is(machine.screenCells[120].innerHTML, 'h')
  assert.is(machine.screenCells[160].innerHTML, 'h')
  assert.is(machine.screenCells[200].innerHTML, '')
})

test ('run to STOP', async() => {
  const result = await runProgram(machine, [
    '10 a = 1',
    '20 PRINT "hello world"',
    '30 a = a + 1',
    '35 STOP',
    '40 IF a <= 5 THEN 20',
    '50 END'
  ], 'RUN')

  assert.is(result.error, ErrorCodes.BREAK + ' in line 35')
})

test('RUN program to END', async () => {
  addProgram(machine, [
    '10 a = 1',
    '20 PRINT "hello world"',
    '30 a = a + 1',
    '40 IF a <= 5 THEN 20',
    '50 END'
  ])
  machine.activateMode('LIVE')
  machine.currentScreen.clearViewport()
  const result = await runLiveCommand(machine, 'RUN')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'h')
  assert.is(machine.screenCells[80].innerHTML, 'h')
  assert.is(machine.screenCells[120].innerHTML, 'h')
  assert.is(machine.screenCells[160].innerHTML, 'h')
  assert.is(machine.screenCells[200].innerHTML, '')
})

test('RUN program to STOP', async () => {
  addProgram(machine, [
    '10 PRINT "hello world"',
    '20 STOP',
    '30 PRINT "we apologize for the inconvenience"',
    '40 END'
  ])
  machine.activateMode('LIVE')
  machine.currentScreen.clearViewport()
  const result = await runLiveCommand(machine, 'RUN')

  assert.is(result.error, ErrorCodes.BREAK + ' in line 20')
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, '')
})

test('CONT program', async() => {
  const result = await runLiveCommand(machine, 'CONT')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'w')
  assert.is(machine.screenCells[80].innerHTML, '')
})

test('CONT program at line', async() => {
  const result = await runLiveCommand(machine, 'CONT 10')

  assert.is(result.error, ErrorCodes.BREAK + ' in line 20')
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'w')
  assert.is(machine.screenCells[80].innerHTML, 'h')
  assert.is(machine.screenCells[120].innerHTML, '')
})

test('RUN program at line', async () => {
  machine.activateMode('LIVE')
  machine.currentScreen.clearViewport()
  const result = await runLiveCommand(machine, 'RUN 30')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'w')
  assert.is(machine.screenCells[40].innerHTML, '')
})

test('NEW', async () => {
  machine.activateMode('LIVE')
  const result = await runLiveCommand(machine, 'NEW')

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.lineNumbers.length, 0)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 0)
})

test.run()
