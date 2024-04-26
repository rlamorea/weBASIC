import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js"
import { tokens } from './testHelpers.js'

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
  // array tests
  { test: 'ar(1)=5', variableExpr: 'ar(1)', value: 5, arrayLength: 11 },
  { test: 'as$(1)="hello"', variableExpr: 'as$(1)', value: 'hello', valueType: 'string', arrayLength: 11 },
  { test: 'at(35)=10', variableExpr: 'at(35)', value: 10, arrayLength: 36 },
  { test: 'ar(10)=6', variableExpr: 'ar(10)', value: 6 },
  { test: 'ar(-1)=4', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'ar(12)=9', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'at(36)=8', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'b(6)=9', interError: ErrorCodes.ILLEGAL_INDEX },
  { test: 'ar("hello")=12', interError: ErrorCodes.ILLEGAL_INDEX },
  { test: 'dim dt(5):dt(3)=7', variableExpr: 'dt(3)', value: 7 },
  { test: 'dim ds(3, 3):ds(2, 1)=9', variableExpr: 'ds(2, 1)', value: 9 },
  { test: 'dt(0)=22', variableExpr: 'dt(0)', value: 22 },
  { test: 'dt(6)=12', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'dt(1, 2)=7', interError: ErrorCodes.ILLEGAL_INDEX },
  { test: 'ds(-1, 2)=7', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'ds(4, 2)=7', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'ds(1, -1)=7', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'ds(1, 4)=7', interError: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'y=2:dq(y)=77', variableExpr: 'dq(2)', value: 77 },
  { test: 'u=2:p=2:dim dh(u,p):dh(u,p)=777', variableExpr: 'dh(2,2)', value: 777 },
  { test: 'dh(4-2,p*1+0)=555', variableExpr: 'dh(2,2)', value: 555 },
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

const dimTests = [
  { test: 'dim da(5)', variable: 'da', arrayLength: 6 },
  { test: 'dim db$(5)', variable: 'db$', arrayLength: 6 },
  { test: 'dim dc(3, 3)', variable: 'dc', arrayLength: [ 4, 4 ] },
  { test: 'dim dd(3, 6, 8)', variable: 'dd', arrayLength: [ 4, 7, 9 ] },
  { test: 'dim da(7)', error: ErrorCodes.REDIM_ARRAY },
  { test: 'dim ar(9)', error: ErrorCodes.REDIM_ARRAY },
  { test: 'dim dx(7), dy(4, 4), dz(3, 3, 5)', variable: 'dz', arrayLength: [ 4, 4, 6 ] },
  { test: 'dim dn(-1)', error: ErrorCodes.INDEX_OUT_OF_BOUNDS },
  { test: 'dim dn(0)', error: ErrorCodes.INDEX_OUT_OF_BOUNDS },
]

for (const testCase of dimTests) {
  test(testCase.test, async () => {
    const result = await inter.interpretLine(testCase.test)

    assert.is(result.error, testCase.error || undefined)
    if (!testCase.error) {
      let value = machine.variables.variableLookup[testCase.variable].value
      if (!Array.isArray(testCase.arrayLength)) testCase.arrayLength = [testCase.arrayLength]
      for (let idx = 0; idx < testCase.arrayLength.length; idx++) {
        assert.is(value.length, testCase.arrayLength[idx])
        if (idx < testCase.arrayLength.length - 1) {
          value = value[Math.floor(Math.random() * testCase.arrayLength[idx])]
        }
      }
    }
  })
}

test.run()
