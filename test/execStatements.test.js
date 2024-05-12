import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import MockMachine from './mockMachine.js'

const machine = new MockMachine({ addScreen: true })

test('run to END', async () => {
  let cs = machine.runCodespace
  machine.execution.addCodeLine(cs, -1, '10 a = 1')
  machine.execution.addCodeLine(cs, -1, '20 PRINT "hello world"')
  machine.execution.addCodeLine(cs, -1, '30 a = a + 1')
  machine.execution.addCodeLine(cs, -1, '40 IF a <= 5 THEN 20')
  machine.execution.addCodeLine(cs, -1, '50 END')

  machine.activateMode('RUN')
  const result = await machine.execution.runCode(cs)

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'h')
  assert.is(machine.screenCells[40].innerHTML, 'h')
  assert.is(machine.screenCells[80].innerHTML, 'h')
  assert.is(machine.screenCells[120].innerHTML, 'h')
  assert.is(machine.screenCells[160].innerHTML, 'h')
  assert.is(machine.screenCells[200].innerHTML, '')
})

test.run()
