import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js"
import nextToken from '../scripts/interpreter/tokenizer.js'

const machine = new Machine()
const inter = new Interpreter({ machine })

const testCases = [
  // { test: 'a=1', variable: 'a', value: 1 },
  { test: 'b=2', variable: 'b', value: 2 },
  // { test: 'c=a+b', variable: 'c', value: 3 },
  // { test: 'd=c+1', variable: 'd', value: 4 },
  // { test: 'e$="e"', variable: 'e$', valueType: 'string', coding: 'variable-string', value: 'e' },
  // { test: 'f$=e$+"f"', variable: 'f$', valueType: 'string', coding: 'variable-string', value: 'ef' },
  // { test: 'let x=2', variable: 'x', value: 2 },
  // { test: 'let y$= "y"', variable: 'y$', valueType: 'string', coding: 'variable-string', value: 'y' },
  // auto-dimension
  { test: 'ar(1)=5', variableExpr: 'ar(1)', value: 5, arrayLength: 11 },
  { test: 'as$(1)="hello"', variableExpr: 'as$(1)', value: 'hello', valueType: 'string', arrayLength: 11 },
  { test: 'at(35)=10', variableExpr: 'at(35)', value: 10, arrayLength: 36 },
  { test: 'ar(10)=6', variableExpr: 'ar(10)', value: 6 },
  { test: 'ar(-1)=4', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'ar(12)=9', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'at(36)=8', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'b(6)=9', interError: ErrorCodes.ILLEGAL_INDEX },
  { test: 'ar("hello")=12', interError: ErrorCodes.ILLEGAL_INDEX },
]

for (const testCase of testCases) {
  test(`${testCase.desc || ''}${testCase.test}`, async () => {
    const result = await inter.interpretLine(testCase.test)
    assert.is(result.error, testCase.interError || undefined)

    let varD = { token: testCase.variable, coding: testCase.coding || 'variable-number', valueType: testCase.valueType || 'number' }
    if (testCase.variableExpr) {
      let t = tokens(testCase.variableExpr)
      varD = inter.lexifier.parseExpression(t, 0)
    }
    const val = machine.variables.getValue(varD, inter)

    assert.is(val.error, testCase.error || undefined)
    if (testCase.value) {
      assert.is(val.value, testCase.value)
      assert.is(val.valueType, testCase.valueType || 'number')
    }
    if (testCase.arrayLength) {
      assert.is(machine.variables.variableLookup[varD.token].value.length, testCase.arrayLength)
    }
  })
}

test.run()
