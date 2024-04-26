import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'

import nextToken from '../scripts/interpreter/tokenizer.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new Machine()
const lex = new Lexifier()
const inter = new Interpreter({ machine })

const vars = [
  { token: 'a', coding: 'variable-number', valueType: 'number', assignTo: 1 },
  { token: 'b$', coding: 'variable-string', valueType: 'string', assignTo: 'b' }
]
for (let v of vars) {
  machine.variables.setValue(v, { value: v.assignTo, valueType: v.valueType })
}

function statementFor(code) {
  let toks = []
  let ts = 0
  while (1 === 1) {
    if (code === null || code.length === 0) { break }
    const td = nextToken(code, ts, true)
    toks.push(td)
    ts = td.tokenEnd
    code = td.restOfLine
  }
  return lex.parseExpression(toks)
}

const testCases = [
  { desc: 'number-literal ', test: '1', type: 'number', value: 1 },
  { desc: 'string-literal ', test: '"hi"', type: 'string', value: 'hi' },
  { desc: 'unary-plus ', test: '+1', value: 1 },
  { desc: 'unary-minus ', test: '-1', value: -1 },
  { test: 'BNOT 125', value: -126 },
  { test: 'BNOT 4294967170', value: 125 },
  { test: 'BNOT 125.3', value: -126 },
  { test: 'BNOT 0', value: -1 },
  { test: 'NOT 1', value: 0 },
  { test: 'NOT 100', value: 0 },
  { test: 'NOT 0.1', value: 0 },
  { test: 'NOT 0', value: 1 },
  { test: 'NOT 0.0', value: 1 },
  { test: '1+1', value: 2 },
  { test: '2^3', value: 8 },
  { test: '27^0.33333333333333333', value: 3 },
  { test: '2*3', value: 6 },
  { test: '1.5*2', value: 3 },
  { test: '6/2', value: 3 },
  { test: '5/0.5', value: 10 },
  { test: '8 DIV 2', value: 4 },
  { test: '9 DIV 2', value: 4 },
  { test: '8.5 DIV 2.2', value: 4 },
  { test: '8 MOD 2', value: 0 },
  { test: '9 MOD 2', value: 1 },
  { test: '9.5 MOD 2.2', value: 1 },
  { test: '10.5+3.2', value: 13.7 },
  { test: '10 - 3', value: 7 },
  { test: '10 - 12', value: -2 },
  { test: '0.5 - 0.3', value: 0.2 },
  { test: '7 BAND 4', value: 4 },
  { test: '128 BAND 16', value: 0 },
  { test: '3.5 BAND 2.5', value: 2 },
  { test: '0 AND 1', value: 0 },
  { test: '1 AND 1', value: 1 },
  { test: '10.5 AND 3.2', value: 1 },
  { test: '4 BOR 3', value: 7 },
  { test: '128 BOR 16', value: 144 },
  { test: '1.5 BOR 2.5', value: 3 },
  { test: '0 OR 1', value: 1 },
  { test: '0 OR 0', value: 0 },
  { test: '10.5 OR 0', value: 1 },
  { test: '0 BXOR 0', value: 0 },
  { test: '0 BXOR 1', value: 1 },
  { test: '64 BXOR 128', value: 192 },
  { test: '255 BXOR 40', value: 215 },
  { test: '0 = 0', value: 1 },
  { test: '0 = 1', value: 0 },
  { test: '200 = 200', value: 1 },
  { test: '1.5 = 1.5', value: 1 },
  { test: '1.5 = 1.50001', value: 0 },
  { test: '0 <> 0', value: 0 },
  { test: '0 <> 1', value: 1 },
  { test: '200 <> 200', value: 0 },
  { test: '1.5 <> 1.5', value: 0 },
  { test: '1.5 <> 1.50001', value: 1 },
  { test: '0 <= 1', value: 1 },
  { test: '1 <= 1', value: 1 },
  { test: '-3 <= 0', value: 1 },
  { test: '1 <= 1.00001', value: 1 },
  { test: '1.00001 <= 1', value: 0 },
  { test: '0 >= 1', value: 0 },
  { test: '1 >= 1', value: 1 },
  { test: '-3 >= 0', value: 0 },
  { test: '1 >= 1.00001', value: 0 },
  { test: '1.00001 >= 1', value: 1 },
  { test: '0 < 1', value: 1 },
  { test: '1 < 1', value: 0 },
  { test: '-3 < 0', value: 1 },
  { test: '1 < 1.00001', value: 1 },
  { test: '1.00001 < 1', value: 0 },
  { test: '0 > 1', value: 0 },
  { test: '1 > 1', value: 0 },
  { test: '-3 > 0', value: 0 },
  { test: '1 > 1.00001', value: 0 },
  { test: '1.00001 > 1', value: 1 },
  { desc: 'precedence ', test: '1 + 2 > 2', value: 1 },
  { desc: 'precedence ', test: '1 - 2 * 3', value: -5 },
  { desc: 'precedence ', test: '(1 - 2) * 3', value: -3 },
  { test: '"a"+"b"', type: 'string', value: 'ab' },
  { test: '"a"="a"', type: 'number', value: 1 },
  { test: '"a"="b"', type: 'number', value: 0 },
  { test: '"a"<>"a"', type: 'number', value: 0 },
  { test: '"a"<>"b"', type: 'number', value: 1 },
  { test: 'a + 1', value: 2 },
  { test: '"a"+b$', type: 'string', value: 'ab' },
  // number format tests
  { test: '0', type: 'number', value: 0 },
  { test: '1234', type: 'number', value: 1234 },
  { test: '01234', type: 'number', value: 1234 },
  { test: '.', type: 'number', value: 0 },
  { test: '.02', type: 'number', value: 0.02 },
  { test: '0.', type: 'number', value: 0 },
  { test: '0.02', type: 'number', value: 0.02 },
  { test: '00.02', type: 'number', value: 0.02 },
  { test: '1E6', type: 'number', value: 1000000 },
  { test: '.E6', type: 'number', value: 0 },
  { test: '.02E6', type: 'number', value: 20000 },
  { test: '1E+2', type: 'number', value: 100 },
  { test: '1E-2', type: 'number', value: 0.01 },
  { test: '1E20', type: 'number', value: 100000000000000000000 },
  { test: '1E02', type: 'number', value: 100 },
  { test: '1e6', type: 'number', value: 1000000 },
  // short circuit tests
  { desc: 'AND short circuit', test: '0 AND q(3,4)=1', value: 0 },
  { desc: 'AND short circuit fail', test: '1 AND q(3,4)=1', error: ErrorCodes.UNDIM_ARRAY },
  { desc: 'OR short circuit', test: '1 OR q(3,4)=1', value: 1 },
  { desc: 'OR short circuit', test: '0 OR q(3,4)=1', error: ErrorCodes.UNDIM_ARRAY },
]
// need to figure out later
//   { desc: 'AND sort circuit', test: '0 AND ()', value: 0 }

for (const testCase of testCases) {
  test(`${testCase.desc || ''}${testCase.test}`, () => {
    let s = statementFor(testCase.test)
    const result = inter.interpretExpression(s)

    assert.is(result.error, testCase.error)
    if (!testCase.error) {
      assert.is(result.valueType, testCase.type || 'number')
      assert.is(result.value, testCase.value)
    }
  })
}

// a few more tests to convert values
const convertTests = [
  { test: 1, as: 'integer', value: 1 },
  { test: 1.0, as: 'integer', value: 1 },
  { test: 1.0, as: 'integer', value: 1 },
  { test: 1.999999, as: 'integer', value: 1 },
  { test: -1, as: 'integer', value: -1 },
  { test: -1.99999, as: 'integer', value: -1 },
  { test: 'hi', type: 'string', as: 'integer', error: ErrorCodes.TYPE_MISMATCH },
  { test: '', as: 'character', value: '\0' },
  { test: 'h', as: 'character', value: 'h' },
  { test: 'hello', as: 'character', value: 'h' },
  { test: 2, type: 'number', as: 'character', error: ErrorCodes.TYPE_MISMATCH },
]

for (const testCase of convertTests) {
  test(`convert ${testCase.test} to ${testCase.as}`, () => {
    let valDef = { value: testCase.test }
    valDef.valueType = testCase.type || (testCase.as === 'integer' ? 'number' : 'string')
    const result = inter.convertValue(valDef, testCase.as)

    assert.is(result.error, testCase.error)
    if (!testCase.error) {
      assert.is(result.value, testCase.value)
    }
  })
}

test.run()
