import { test } from 'uvu';
import * as assert from 'uvu/assert';

import nextToken from '../scripts/interpreter/tokenizer.js'
import Lexifier from '../scripts/interpreter/lexifier.js'
import Machine from './mockMachine.js'

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
  { test: `TAN(${pi}/2)`, value: 16331239353195370},
  { test: 'TAN(-1)', value: -1.5574077246549023 },
]

// TODO: SQR of a negative?

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
