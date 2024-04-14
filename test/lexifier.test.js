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

test('paren - ()', () => {
  let t = tokens('()')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 0)
})

test('paren - ( )', () => {
  let t = tokens('( )')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 0)
})

test('paren - (255)', () => {
  let t = tokens('(255)')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 1)
  assert.is(result.parenTokens[0].token, '255')
})

test('paren - (255 - 10)', () => {
  let t = tokens('(255 - 10)')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 3)
  assert.is(result.parenTokens[0].token, '255')
  assert.is(result.parenTokens[1].coding, 'minus')
  assert.is(result.parenTokens[2].token, '10')
})

test('paren - (255 - 10) + 2', () => {
  let t = tokens('(255 - 10) + 2')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 3)
  assert.is(result.parenTokens[0].token, '255')
  assert.is(result.parenTokens[1].coding, 'minus')
  assert.is(result.parenTokens[2].token, '10')
  assert.is(result.restOfTokens.length, 2)
  assert.is(result.restOfTokens[0].coding, 'plus')
  assert.is(result.restOfTokens[1].coding, 'number-literal')
})

test('paren - (255 - (10+foo)', () => {
  let t = tokens('(255 - (10+foo))')
  const op = t.shift()
  const result = lex.parseToCloseParen(t,op.tokenStart)

  assert.is(result.parenTokens.length, 7)
  assert.is(result.parenTokens[0].token, '255')
  assert.is(result.parenTokens[1].coding, 'minus')
  assert.is(result.parenTokens[2].coding, 'open-paren')
  assert.is(result.parenTokens[3].coding, 'number-literal')
  assert.is(result.parenTokens[4].coding, 'plus')
  assert.is(result.parenTokens[5].coding, 'variable-number')
  assert.is(result.parenTokens[6].coding, 'close-paren')
})

test('param - none', () => {
  let t = tokens('  ')
  const result = lex.parseIntoParameters(t, t[0].tokenStart)

  assert.is(result.parameters.length, 0)
})

test('param - 0', () => {
  let t = tokens('0')
  const result = lex.parseIntoParameters(t, t[0].tokenStart)

  assert.is(result.parameters.length, 1)
  assert.is(result.parameters[0].coding, 'number-literal')
})

test('param - 1, 1', () => {
  let t = tokens('1, 1')
  const result = lex.parseIntoParameters(t, t[0].tokenStart)

  assert.is(result.parameters.length, 2)
  assert.is(result.parameters[0].coding, 'number-literal')
  assert.is(result.parameters[1].coding, 'number-literal')
})

test('param - 1, RND(1, 2)', () => {
  let t = tokens('1, RND(1, 2)')
  const result = lex.parseIntoParameters(t, t[0].tokenStart)

  assert.is(result.parameters.length, 2)
  assert.is(result.parameters[0].coding, 'number-literal')
  assert.is(result.parameters[1].coding, 'function')
  assert.is(result.parameters[1].parameters.length, 2)
})

test('expression - 0', () => {
  let t = tokens('0')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'number-literal')
})

test('expression - "hi"', () => {
  let t = tokens('"hi"')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'string-literal')
})

test('expression - -1', () => {
  let t = tokens('-1')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'number-literal')
  assert.is(result.unaryOperator.coding, 'unary-operator')
})

test('expression - 1+1', () => {
  let t = tokens('1+1')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.pre.coding, 'number-literal')
  assert.is(result.operator.coding, 'binary-operator')
  assert.is(result.post.coding, 'number-literal')
})

test('expression - "1"+"1"', () => {
  let t = tokens('"1"+"1"')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.pre.coding, 'string-literal')
  assert.is(result.operator.coding, 'binary-operator')
  assert.is(result.post.coding, 'string-literal')
})

test('expression - (+2)', () => {
  let t = tokens('(+2)')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'paren-group')
  assert.is(result.expression.coding, 'number-literal')
  assert.is(result.expression.unaryOperator.coding, 'unary-operator')
})

test('expression - 1+(-2*3)', () => {
  let t = tokens('1+(-2*3)')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.pre.coding, 'number-literal')
  assert.is(result.operator.token, '+')
  assert.is(result.post.coding, 'paren-group')
  assert.is(result.post.expression.coding, 'calculation')
  assert.is(result.post.expression.pre.coding, 'number-literal')
  assert.is(result.post.expression.pre.unaryOperator.token, '-')
  assert.is(result.post.expression.operator.coding, 'binary-operator')
  assert.is(result.post.expression.post.coding, 'number-literal')
})

test('expression - 1--1', () => {
  let t = tokens('1--1')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.pre.coding, 'number-literal')
  assert.is(result.operator.coding, 'binary-operator')
  assert.is(result.post.coding, 'number-literal')
  assert.is(result.post.unaryOperator.token, '-')
})

test('expression - 9 * 8 / 7 DIV 6 MOD 5 + 4 - 3 = 2 <> 1', () => {
  let t = tokens('9 * 8 / 7 DIV 6 MOD 5 + 4 - 3 = 2 <> 1')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.pre.pre.pre.pre.pre.pre.pre.operator.token, '*')
})

test('expression - 9 - 8 DIV 7 AND 6 * 5 + 4 / 3 OR 2 MOD BNOT 1', () => {
  let t = tokens('9 - 8 DIV 7 AND 6 * 5 + 4 / 3 OR 2 MOD BNOT 1')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.operator.token, 'OR')
  assert.is(result.pre.operator.token, 'AND')
  assert.is(result.post.operator.token, 'MOD')
})

test('expression - 1 + 1 + 1 * 3 + 2', () => {
  let t = tokens('1 + 1 + 1 * 3 + 2')
  const result = lex.parseExpression(t, t[0].tokenStart)

  assert.is(result.coding, 'calculation')
  assert.is(result.operator.token, '+')
  assert.is(result.pre.coding, 'number-literal')
  assert.is(result.post.operator.token, '+')
  assert.is(result.post.post.pre.coding, 'calculation')
})

test.run()
