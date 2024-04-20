import { test } from 'uvu';
import * as assert from 'uvu/assert';

import Machine from './mockMachine.js'

import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new Machine()
const inter = new Interpreter({ machine })

const testCases = [
  { test: 'a=1', variable: 'a', value: 1 },
  { test: 'b=2', variable: 'b', value: 2 },
  { test: 'c=a+b', variable: 'c', value: 3 },
  { test: 'd=c+1', variable: 'd', value: 4 },
  { test: 'e$="e"', variable: 'e$', valueType: 'string', coding: 'variable-string', value: 'e' },
  { test: 'f$=e$+"f"', variable: 'f$', valueType: 'string', coding: 'variable-string', value: 'ef' },
  { test: 'let x=2', variable: 'x', value: 2 },
  { test: 'let y$= "y"', variable: 'y$', valueType: 'string', coding: 'variable-string', value: 'y' },
]

for (const testCase of testCases) {
  test(`${testCase.desc || ''}${testCase.test}`, () => {
    inter.interpretLine(testCase.test)

    const varD = { token: testCase.variable, coding: testCase.coding || 'variable-number', valueType: testCase.valueType || 'number' }
    const val = machine.variables.getValue(varD, inter)

    assert.is(val.error, undefined)
    assert.is(val.value, testCase.value)
    assert.is(val.valueType, testCase.valueType || 'number')
  })
}

test.run()
