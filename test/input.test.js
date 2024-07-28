import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";
import { tokens, sendToInput } from './testHelpers.js'

const machine = new Machine({ addScreen: true })
const inter = new Interpreter(machine)

test('input a', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '2')
  const result = await inter.interpretLine('input a')

  assert.is(result.error, undefined)
  const varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('input b$', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, 'hello')
  const result = await inter.interpretLine('input b$')

  assert.is(result.error, undefined)
  const varD = { token: 'b$', coding: 'variable-string', valueType: 'string' }
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 'hello')
})

test('input a,b$', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '2, hello')
  const result = await inter.interpretLine('input a, b$')

  assert.is(result.error, undefined)
  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)

  varD = { token: 'b$', coding: 'variable-string', valueType: 'string' }
  val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 'hello')
})

test('input "prompt"; a', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '2')
  const result = await inter.interpretLine('input "prompt"; a')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'p')
  assert.is(machine.screenCells[6].innerHTML, '?')
  assert.is(machine.screenCells[8].innerHTML, '2')

  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('input "prompt" a', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '2')
  const result = await inter.interpretLine('input "prompt" a')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'p')
  assert.is(machine.screenCells[5].innerHTML, 't')
  assert.is(machine.screenCells[6].innerHTML, '2')
  assert.is(machine.currentScreen.cursorLocation[0], 1)
  assert.is(machine.currentScreen.cursorLocation[1], 2)

  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

// error cases
test('input a - error', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, 'hello')
  const result = await inter.interpretLine('input a')

  assert.is(result.error, ErrorCodes.ILLEGAL_VALUE )
})

test('input a - empty', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '')
  const result = await inter.interpretLine('input a')

  assert.is(result.error, undefined)
  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('input x - empty', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '')
  const result = await inter.interpretLine('input x')

  assert.is(result.error, undefined)
  let varD = { token: 'x', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 0)
})

test('input b$, a - error', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, 'hello, hi')
  const result = await inter.interpretLine('input b$, a')

  assert.is(result.error, ErrorCodes.ILLEGAL_VALUE )
})

test('input b$, a - empty', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, '')
  const result = await inter.interpretLine('input b$, a')

  assert.is(result.error, undefined)
  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
  varD = { token: 'b$', coding: 'variable-string', valueType: 'string' }
  val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 'hello')
})

test('input b$, a, y - commas', async () => {
  machine.screen.clearViewport()
  sendToInput(machine, ', , ')
  const result = await inter.interpretLine('input b$, a, y')

  assert.is(result.error, undefined)
  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 0)
  varD = { token: 'b$', coding: 'variable-string', valueType: 'string' }
  val = machine.variables.getValue(varD, inter)
  assert.is(val.value, '')
  varD = { token: 'y', coding: 'variable-number', valueType: 'number' }
  val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 0)
})

test('input c(3)', async() => {
  machine.screen.clearViewport()
  sendToInput(machine, '2')
  const result = await inter.interpretLine('input c(3)')

  assert.is(result.error, undefined)
  const t = tokens('c(3)')
  const varD = inter.lexifier.parseExpression(t, 0)
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('dim d(3, 3):input d(1, 2)', async() => {
  machine.screen.clearViewport()
  sendToInput(machine, '2')
  const result = await inter.interpretLine('dim d(3, 3):input d(1, 2)')

  assert.is(result.error, undefined)
  const t = tokens('d(1, 2)')
  const varD = inter.lexifier.parseExpression(t, 0)
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('d1=2:d2=1:input d(d1, d2)', async() => {
  machine.screen.clearViewport()
  sendToInput(machine, '223')
  const result = await inter.interpretLine('d1=2:d2=1:input d(d1, d2)')

  assert.is(result.error, undefined)
  const t = tokens('d(2, 1)')
  const varD = inter.lexifier.parseExpression(t, 0)
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 223)
})

test.run()