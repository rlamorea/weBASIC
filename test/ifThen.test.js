import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import { runProgram, compareTestString } from './testHelpers.js';

import MockMachine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new MockMachine({ addScreen: true })
const inter = new Interpreter(machine)

const testCases = [
  { test: 'if 1 then', value: 1 },
  { test: 'if 0 then', value: 0 },
  { test: 'if 1 > 0 then', value: 1 },
  { test: 'if 1 < 0 then', value: 0 },
  { test: 'if 1 > 0 and 0 < 1 then', value: 1 },
  { test: 'if 1 > 0 and 0 > 1 then', value: 0 },
  { test: 'if 1 then:', value: 1 },
  { test: 'if 0 then:', value: 0 },
  { test: 'if 1 then r=3:', value: 1 },
  { test: 'if 0 then r=3:', value: 0 },
  { test: 'if "a"="a" then', value: 1 },
  { test: 'if "a"="b" then', value: 0 },
  { test: 'if "a"<>"a" then', value: 0 },
  { test: 'if "a"<>"b" then', value: 1 },
]

for (const testCase of testCases) {
  test(`${testCase.test}...`, async () => {
    const testCode = `r=0:${testCase.test} r=1`
    const result = await inter.interpretLine(testCode)

    assert.is(result.error, testCase.error)
    if (testCase.value) {
      let varD = { token: 'r', coding: 'variable-number', valueType: 'number' }
      assert.is(machine.variables.getValue(varD).value, 1)
    }
  })
}

// testing a bug found when getting ready for else
test('no else, to eol - executed', async () => {
  const result = await runProgram(machine, [ '10 if a=0 then print "hello ";:print "world"', '20 print"foo"' ])

  assert.is(result.error, undefined)
  compareTestString('hello world', machine.screenCells, 0, 40)
  compareTestString('foo', machine.screenCells, 40, 40)
})

test('no else, to eol - skipped', async () => {
  const result = await runProgram(machine, [ '10 a=1:if a=0 then print "hello ";:print "world"', '20 print"foo"' ])

  assert.is(result.error, undefined)
  compareTestString('foo', machine.screenCells, 0, 40)
})

test('else with statement - skipped', async () => {
  const result = await runProgram(machine, [
    '10 a=0:if a=0 then print "hello";:else print "hi";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hello world', machine.screenCells, 0, 40)
})

test('else with statement - executed', async () => {
  const result = await runProgram(machine, [
    '10 a=1:if a=0 then print "hello";:else print "hi";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hi world', machine.screenCells, 0, 40)
})

test('else with no statement - skipped', async () => {
  const result = await runProgram(machine, [
    '10 a=0:if a=0 then print "hello";:else:print "hi";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hello world', machine.screenCells, 0, 40)
})

test('else with no statement - executed', async () => {
  const result = await runProgram(machine, [
    '10 a=1:if a=0 then print "hello";:else:print "hi";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hi world', machine.screenCells, 0, 40)
})

test('if and else multi-statement - if case', async () => {
  const result = await runProgram(machine, [
    '10 a=0:if a=0 then print "hello";:print " there";:else:print "hi";:print " ya";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hello there world', machine.screenCells, 0, 40)
})

test('if and else multi-statement - else case', async () => {
  const result = await runProgram(machine, [
    '10 a=1:if a=0 then print "hello";:print " there";:else:print "hi";:print " ya";',
    '20 print " world"'
  ])

  assert.is(result.error, undefined)
  compareTestString('hi ya world', machine.screenCells, 0, 40)
})

test.run()