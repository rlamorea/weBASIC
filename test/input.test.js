import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";
import { tokens } from './testHelpers.js'

const machine = new Machine({ addScreen: true })
const inter = new Interpreter({ machine })

function sendToInput(string) {
  if (machine.currentInput) {
    for (const ch of string) {
      machine.currentInput.handleKey({ key: ch })
    }
    machine.currentInput.handleKey({ key: 'Enter' })
  } else {
    setTimeout(() => { sendToInput(string) }, 100 )
  }
}

test('input a', async () => {
  machine.screen.clearViewport()
  sendToInput('2')
  const result = await inter.interpretLine('input a')

  assert.is(result.error, undefined)
  const varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('input b$', async () => {
  machine.screen.clearViewport()
  sendToInput('hello')
  const result = await inter.interpretLine('input b$')

  assert.is(result.error, undefined)
  const varD = { token: 'b$', coding: 'variable-string', valueType: 'string' }
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 'hello')
})

test('input a,b$', async () => {
  machine.screen.clearViewport()
  sendToInput('2, hello')
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
  sendToInput('2')
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
  sendToInput('2')
  const result = await inter.interpretLine('input "prompt" a')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'p')
  assert.is(machine.screenCells[5].innerHTML, 't')
  assert.is(machine.screenCells[6].innerHTML, '2')

  let varD = { token: 'a', coding: 'variable-number', valueType: 'number' }
  let val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

// error cases
test('input a - error', async () => {
  machine.screen.clearViewport()
  sendToInput('hello')
  const result = await inter.interpretLine('input a')

  assert.is(result.error, ErrorCodes.ILLEGAL_VALUE )
})

test('input b$, a - error', async () => {
  machine.screen.clearViewport()
  sendToInput('hello, hi')
  const result = await inter.interpretLine('input b$, a')

  assert.is(result.error, ErrorCodes.ILLEGAL_VALUE )
})

test('input c(3)', async() => {
  machine.screen.clearViewport()
  sendToInput('2')
  const result = await inter.interpretLine('input c(3)')

  assert.is(result.error, undefined)
  const t = tokens('c(3)')
  const varD = inter.lexifier.parseExpression(t, 0)
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test('dim d(3, 3):input d(1, 2)', async() => {
  machine.screen.clearViewport()
  sendToInput('2')
  const result = await inter.interpretLine('dim d(3, 3):input d(1, 2)')

  assert.is(result.error, undefined)
  const t = tokens('d(1, 2)')
  const varD = inter.lexifier.parseExpression(t, 0)
  const val = machine.variables.getValue(varD, inter)
  assert.is(val.value, 2)
})

test.run()