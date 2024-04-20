import { test } from 'uvu';
import * as assert from 'uvu/assert';

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new Machine({ addScreen: true })
const inter = new Interpreter({ machine })

test('PRINT', () => {
  const result = inter.interpretLine('PRINT')

  assert.is(result.error, undefined)
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi"', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi"')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[1].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi";', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[1].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 3)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi" "hi"', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi" "hi";')

  assert.is(result.error, 'Syntax Error')
})

test('PRINT "hi";"hi";', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi";"hi";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 5)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi"+"hi"', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi"+"hi"')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi";25;"lo";', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi";25;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi";20+5;"lo";', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi";20+5;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, '5')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi";(23+2);"lo";', () => {
  machine.screen.home()
  const result = inter.interpretLine('PRINT "hi";(23+2);"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('a=25:PRINT "hi";25;"lo";', () => {
  machine.screen.home()
  const result = inter.interpretLine('a=25:PRINT "hi";a;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test.run()