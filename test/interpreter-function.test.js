import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { precision } from "./testHelpers.js"
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
const machine = new Machine()

import nextToken from '../scripts/interpreter/tokenizer.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

import Interpreter from "../scripts/interpreter/interpreter.js";

const lex = new Lexifier()
const inter = new Interpreter(machine)

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

const pi = '3.141592653589793'

const testCases = [
  { test: 'ABS(1)', value: 1 },
  { test: 'ABS(0)', value: 0 },
  { test: 'ABS(-1)', value: 1 },
  { test: 'ATN(0)', value: 0 },
  { test: 'ATN(1)', value: 0.7853981633974483 },
  { test: 'ATN(-1)', value: -0.7853981633974483 },
  { test: 'COS(0)', value: 1 },
  { test: `COS(${pi})`, value: -1 },
  { test: `COS(-${pi})`, value: -1 },
  { test: 'EXP(0)', value: 1 },
  { test: 'EXP(1)', value: 2.718281828459045 },
  { test: 'EXP(0.5)', value: 1.6487212707001282 },
  { test: 'INT(0.5)', value: 0 },
  { test: 'INT(-3.5)', value: -3 },
  { test: 'INT(10.95354)', value: 10 },
  { test: 'LOG(0)', error: 'Illegal Value' },
  { test: 'LOG(1)', value: 0 },
  { test: 'LOG(-1)', error: 'Illegal Value' },
  { test: 'SIN(0)', value: 0 },
  { test: `SIN(${pi}/2)`, value: 1 },
  { test: `SIN(-${pi}/2)`, value: -1 },
  { test: 'SQR(16)', value: 4 },
  { test: 'SQR(144)', value: 12 },
  { test: 'SQR(-144)', error: 'Illegal Value' },
  { test: 'TAN(0)', value: 0 },
  { test: `TAN(${pi}/2)`, value: 16331239353195370 },
  { test: 'TAN(-1)', value: -1.5574077246549023 },
  { test: 'FRAC(0)', value: 0},
  { test: 'FRAC(0.1)', value: 0.1 },
  { test: 'FRAC(10.1)', value: 0.1 },
  { test: 'FRAC(-0.1)', value: -0.1 },
  { test: 'FRAC(-10.1)', value: -0.1 },
  { test: 'LOG10(1)', value: 0 },
  { test: 'LOG10(1000)', value: 3 },
  { test: 'LOG10(0.001)', value: -3 },
  { test: 'LOG10(0)', error: 'Illegal Value' },
  { test: 'PI()', value: Math.PI },
  { test: 'PI(1)', error: 'Syntax Error' },
  { test: 'ROUND(0)', value: 0 },
  { test: 'ROUND(100)', value: 100 },
  { test: 'ROUND(1.1)', value: 1 },
  { test: 'ROUND(1.5)', value: 2 },
  { test: 'ROUND(1.9)', value: 2 },
  { test: 'ROUND(-1.5)', value: -1 },
  { test: 'ROUND(-1.51)', value: -2 },
  { test: 'ROUND(-1.1)', value: -1 },
  { test: 'ROUND(-1.9)', value: -2 },
  { test: 'ROUND(125, 1)', value: 130 },
  { test: 'ROUND(1.21242, -3)', value: 1.212 },
  { test: 'SGN(0)', value: 0 },
  { test: 'SGN(10)', value: 1 },
  { test: 'SGN(0.1)', value: 1 },
  { test: 'SGN(-0.1)', value: -1 },
  { test: 'SGN(-10)', value: -1 },
  { test: 'LEN("")', value: 0 },
  { test: 'LEN("hello world")', value: 11 },
  { test: 'CHARAT$("hello world", 5)', value: 'o', type: 'string' },
  { test: 'CHARAT$("hello world", 0)', error: ErrorCodes.ILLEGAL_INDEX },
  { test: 'CHARAT$("hello world", 11)', value: 'd', type: 'string' },
  { test: 'CHARAT$("hello world", 12)', error: ErrorCodes.ILLEGAL_INDEX },
  { test: 'CHARAT$("", 1)', error: ErrorCodes.ILLEGAL_INDEX },
  { test: 'LEFT$("hello world", 5)', value: 'hello', type: 'string' },
  { test: 'LEFT$("hello world", 15)', value: 'hello world', type: 'string' },
  { test: 'LEFT$("", 1)', value: '', type: 'string' },
  { test: 'RIGHT$("hello world", 5)', value: 'world', type: 'string' },
  { test: 'RIGHT$("hello world", 15)', value: 'hello world', type: 'string' },
  { test: 'RIGHT$("", 1)', value: '', type: 'string' },
  { test: 'MID$("hello world", 4, 8)', value: 'lo wo', type: 'string' },
  { test: 'MID$("hello world", 4, 15)', value: 'lo world', type: 'string' },
  { test: 'MID$("hello world", 4)', value: 'lo world', type: 'string' },
  { test: 'MID$("hello world", 14)', value: '', type: 'string' },
  { test: 'MID$("hello world", 14, 18)', value: '', type: 'string' },
  { test: 'MID$("", 1, 10)', value: '', type: 'string' },
  { test: 'ASC("")', value: 0 },
  { test: 'ASC("0")', value: 48 },
  { test: 'ASC("ABC")', value: 65 },
  { test: 'ASC("≤")', value: 8804 },
  { test: 'CHR$(0)', value: String.fromCharCode(0), type: 'string' },
  { test: 'CHR$(48)', value: '0', type: 'string' },
  { test: 'CHR$(8804)', value: '≤', type: 'string' },
  { test: 'VAL("0")', value: 0 },
  { test: 'VAL("1.1")', value: 1.1 },
  { test: 'VAL("-1")', value: -1 },
  { test: 'VAL("-1.1")', value: -1.1 },
  { test: 'VAL("1e+2")', value: 100 },
  { test: 'VAL("1e-2")', value: 0.01 },
  { test: 'VAL("12abc")', value: 12 },
  { test: 'VAL("abc")', error: ErrorCodes.ILLEGAL_VALUE },
  { test: 'VAL(5)', value: 5 },
  { test: 'VAL($0a)', value: 10 },
  { test: 'VAL(".")', value: 0 },
  { test: 'STR$(10)', value: '10', type: 'string' },
  { test: 'STR$(0.1)', value: '0.1', type: 'string' },
  { test: 'STR$(-10)', value: '-10', type: 'string' },
  { test: 'STR$(-5.15)', value: '-5.15', type: 'string' },
  { test: 'STR$(5000, "R16")', value: '1388', type: 'string' },
  { test: 'STR$(5000, "R8")', value: '11610', type: 'string' },
  { test: 'STR$(100, "r2")', value: '1100100', type: 'string' },
  { test: 'STR$(-5000, "R16")', value: '-1388', type: 'string' },
  { test: 'STR$(500, "w5")', value: '  500', type: 'string' },
  { test: 'STR$(5000, "w5")', value: ' 5000', type: 'string' },
  { test: 'STR$(500000, "w5")', value: 'xxxxx', type: 'string' },
  { test: 'STR$(500000, "w5.")', value: '.....', type: 'string' },
  { test: 'STR$(50000000, "w7")', value: ' 5.0e+7', type: 'string' },
  { test: 'STR$(5050000000, "w9")', value: '  5.05e+9', type: 'string' },
  { test: 'STR$(100, "M4")', value: '100', type: 'string' },
  { test: 'STR$(1000, "M4")', value: '1000', type: 'string' },
  { test: 'STR$(10000, "m4")', value: 'xxxxx', type: 'string' },
  { test: 'STR$(100.01, "m4")', value: '100.01', type: 'string' },
  { test: 'STR$(10000.01, "M4")', value: 'xxxxx.xx', type: 'string' },
  { test: 'STR$(5000, "r16,M8")', value: '00001388', type: 'string' },
  { test: 'STR$(100, "f2")', value: '100.00', type: 'string' },
  { test: 'STR$(100.2222, "f2")', value: '100.22', type: 'string' },
  { test: 'STR$(100.2299, "f2")', value: '100.23', type: 'string' },
  { test: 'STR$(1000, "C")', value: '1,000', type: 'string' },
  { test: 'STR$(1000000, "C ")', value: '1 000 000', type: 'string' },
  { test: 'STR$(5000, "R16,M8,C")', value: '0000 1388', type: 'string' },
  { test: 'STR$(100.55, "D@44")', value: '100,55', type: 'string' },
  { test: 'STR$(100, "w5,Z")', value: '00100', type: 'string' },
  { test: 'STR$(100, "w5,Z.")', value: '..100', type: 'string' },
  { test: 'STR$(100, "s ")', value: ' 100', type: 'string' },
  { test: 'STR$(100, "s+")', value: '+100', type: 'string' },
  { test: 'STR$(100, "s(")', value: ' 100 ', type: 'string' },
  { test: 'STR$(-100, "S(")', value: '(100)', type: 'string' },
  { test: 'STR$(100, "E1")', value: '1.0e+2', type: 'string' },
  { test: 'STR$(500000, "E0,W5")', value: 'xxxxx', type: 'string' },
]

for (const testCase of testCases) {
  test(`${testCase.desc || ''}${testCase.test}`, () => {
    let s = statementFor(testCase.test)
    const result = inter.interpretExpression(s)

    assert.is(result.error, testCase.error)
    if (!testCase.error) {
      assert.is(result.valueType, testCase.type || 'number')
      if (testCase.type === 'string') {
        assert.is(result.value, testCase.value)
      } else {
        const prec = testCase.precision || 14
        assert.is(precision(result.value, prec), precision(testCase.value, prec))
      }
    }
  })
}

function runRand(statement) {
  let min = 100
  let max = -100
  let valueType = 'number'
  for (let cnt = 0; cnt < 100; cnt++) {
    const result = inter.interpretExpression(statement)
    if (result.error) return result
    if (result.valueType !== 'number') { valueType = result.valueType }
    min = Math.min(min, result.value)
    max = Math.max(max, result.value)
  }
  return { min, max, valueType }
}

test('RND()', () => {
  let s = statementFor('RND()')
  const result = runRand(s)

  assert.is(result.error, undefined)
  assert.is(result.valueType, 'number')
  assert.ok(result.min >= 0)
  assert.ok( result.max < 1)
})

test('RND(5)', () => {
  let s = statementFor('RND(5)')
  const result = runRand(s)

  assert.is(result.error, undefined)
  assert.is(result.valueType, 'number')
  assert.is(result.min, 1)
  assert.is( result.max, 5)
})

test('RND(5, 10)', () => {
  let s = statementFor('RND(5, 10)')
  const result = runRand(s)

  assert.is(result.error, undefined)
  assert.is(result.valueType, 'number')
  assert.is(result.min, 5)
  assert.is( result.max, 10)
})

test('RND(-2, 3)', () => {
  let s = statementFor('RND(-2, 3)')
  const result = runRand(s)

  assert.is(result.error, undefined)
  assert.is(result.valueType, 'number')
  assert.is(result.min, -2)
  assert.is( result.max, 3)
})

test.run()

