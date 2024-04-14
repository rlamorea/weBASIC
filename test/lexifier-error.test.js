import { test } from 'uvu';
import * as assert from 'uvu/assert';

import nextToken from '../scripts/tokenizer.js'
import Lexifier from '../scripts/lexifier.js'

const lex = new Lexifier()

function tokens(code) {
  let toks = []
  let ts = 0
  while (1 === 1) {
    if (code === null || code.length === 0) { return toks }
    const td = nextToken(code, ts, true)
    toks.push(td)
    ts = td.tokenEnd
    code = td.restOfLine
  }
}

const testCases = [
  { category: 'paren', test: '(', error: 'Unclosed Paren' },
  { category: 'paren', test: '(255', error: 'Unclosed Paren' },
  { category: 'paren', test: '(255 - 10', error: 'Unclosed Paren' },
  { category: 'paren', test: '(255 - (10 + foo)', error: 'Unclosed Paren' },
  { category: 'paren', test: '((255 - 10) + foo', error: 'Unclosed Paren' },
  { category: 'param', test: '0,,0', error: 'Unspecified Param' },
  { category: 'param', test: 'PRINT', error: 'Syntax Error' },
  { category: 'param', test: '1, PRINT', error: 'Syntax Error' },
  { category: 'expression', test: 'PRINT', error: 'Syntax Error' },
  { category: 'expression', test: '- "hello"', error: 'Type Mismatch' },
  { category: 'expression', test: '"hello" - " world"', error: 'Type Mismatch' },
  { category: 'expression', test: '2 + "hello"', error: 'Type Mismatch' },
  { category: 'expression', test: '3 + CHR$(255)', error: 'Type Mismatch' },
  { category: 'expression', test: 'CHR$(255) + 3', error: 'Type Mismatch' },
  { category: 'expression', test: '3 + variable$', error: 'Type Mismatch' },
  { category: 'expression', test: 'variable$ + 3', error: 'Type Mismatch' },
  { category: 'expression', test: '"hello " + variable', error: 'Type Mismatch' },
  { category: 'expression', test: 'variable% + "hello', error: 'Type Mismatch' },
  { category: 'expression', test: 'variable% + ', error: 'Syntax Error' },
]

for (const testCase of testCases) {
  test(`${testCase.category} - ${testCase.test}`, () => {
    let t = tokens(testCase.test)
    let result = { }
    if (testCase.category === 'paren') {
      const op = t.shift()
      result = lex.parseToCloseParen(t,op.tokenStart)
    } else if (testCase.category === 'param') {
      result = lex.parseIntoParameters(t,t[0].tokenStart)
    } else { // expression
      result = lex.parseExpression(t,t[0].tokenStart)
    }

    assert.ok(result.error.startsWith(testCase.error))
  })
}

// test('expression - 0', () => {
//   let t = tokens('0')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'number-literal')
// })
//
// test('expression - "hi"', () => {
//   let t = tokens('"hi"')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'string-literal')
// })
//
// test('expression - -1', () => {
//   let t = tokens('-1')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'number-literal')
//   assert.is(result.unaryOperator.coding, 'unary-operator')
// })
//
// test('expression - 1+1', () => {
//   let t = tokens('1+1')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.pre.coding, 'number-literal')
//   assert.is(result.operator.coding, 'binary-operator')
//   assert.is(result.post.coding, 'number-literal')
// })
//
// test('expression - "1"+"1"', () => {
//   let t = tokens('"1"+"1"')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.pre.coding, 'string-literal')
//   assert.is(result.operator.coding, 'binary-operator')
//   assert.is(result.post.coding, 'string-literal')
// })
//
// test('expression - (+2)', () => {
//   let t = tokens('(+2)')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'paren-group')
//   assert.is(result.expression.coding, 'number-literal')
//   assert.is(result.expression.unaryOperator.coding, 'unary-operator')
// })
//
// test('expression - 1+(-2*3)', () => {
//   let t = tokens('1+(-2*3)')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.pre.coding, 'number-literal')
//   assert.is(result.operator.token, '+')
//   assert.is(result.post.coding, 'paren-group')
//   assert.is(result.post.expression.coding, 'calculation')
//   assert.is(result.post.expression.pre.coding, 'number-literal')
//   assert.is(result.post.expression.pre.unaryOperator.token, '-')
//   assert.is(result.post.expression.operator.coding, 'binary-operator')
//   assert.is(result.post.expression.post.coding, 'number-literal')
// })
//
// test('expression - 1--1', () => {
//   let t = tokens('1--1')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.pre.coding, 'number-literal')
//   assert.is(result.operator.coding, 'binary-operator')
//   assert.is(result.post.coding, 'number-literal')
//   assert.is(result.post.unaryOperator.token, '-')
// })
//
// test('expression - 9 * 8 / 7 DIV 6 MOD 5 + 4 - 3 = 2 <> 1', () => {
//   let t = tokens('9 * 8 / 7 DIV 6 MOD 5 + 4 - 3 = 2 <> 1')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.pre.pre.pre.pre.pre.pre.pre.operator.token, '*')
// })
//
// test('expression - 9 - 8 DIV 7 AND 6 * 5 + 4 / 3 OR 2 MOD BNOT 1', () => {
//   let t = tokens('9 - 8 DIV 7 AND 6 * 5 + 4 / 3 OR 2 MOD BNOT 1')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.operator.token, 'OR')
//   assert.is(result.pre.operator.token, 'AND')
//   assert.is(result.post.operator.token, 'MOD')
// })
//
// test('expression - 1 + 1 + 1 * 3 + 2', () => {
//   let t = tokens('1 + 1 + 1 * 3 + 2')
//   const result = lex.parseExpression(t, t[0].tokenStart)
//
//   assert.is(result.coding, 'calculation')
//   assert.is(result.operator.token, '+')
//   assert.is(result.pre.coding, 'number-literal')
//   assert.is(result.post.operator.token, '+')
//   assert.is(result.post.post.pre.coding, 'calculation')
// })

test.run()
