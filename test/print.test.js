import { test } from 'uvu';
import * as assert from 'uvu/assert';

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new Machine({ addScreen: true })
const inter = new Interpreter({ machine })

test('PRINT', async () => {
  const result = await inter.interpretLine('PRINT')

  assert.is(result.error, undefined)
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi"', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi"')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[1].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[1].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 3)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi" "hi"', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi" "hi";')

  assert.is(result.error, 'Syntax Error')
})

test('PRINT "hi";"hi";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi";"hi";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 5)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi"+"hi"', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi"+"hi"')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, 'i')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('PRINT "hi";25;"lo";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi";25;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi";20+5;"lo";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi";20+5;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[3].innerHTML, '5')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('PRINT "hi";(23+2);"lo";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('PRINT "hi";(23+2);"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('a=25:PRINT "hi";25;"lo";', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('a=25:PRINT "hi";a;"lo";')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[2].innerHTML, '2')
  assert.is(machine.screenCells[4].innerHTML, 'l')
  assert.is(machine.screen.viewportCursorLocation[0], 7)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('b=2:print b*b', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('b=2:print b*b')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '4')
})

test('ar(5)=2:print ar(5);ar(2)', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('ar(5)=2:print ar(5);ar(2)')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('dim ax(3, 3):ax(1, 2)=2:print ax(1, 2);ax(2, 1)', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('dim ax(3, 3):ax(1, 2)=2:print ax(1, 2);ax(2, 1)')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('z1=2:z2=2:ax(z1, z2)=27:print ax(2, 2)', async () => {
  machine.screen.home()
  const result = await inter.interpretLine('z1=2:z2=2:ax(z1, z2)=27:print ax(2, 2)')

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '7')
})

test.run()