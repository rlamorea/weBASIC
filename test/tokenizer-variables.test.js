import { test } from 'uvu';
import * as assert from 'uvu/assert';

import nextToken from '../scripts/tokenizer.js'

function testToken(input, coding, token) {
  let inputTok = input
  if (typeof input === 'string' || input instanceof String) {
    token = token || input
    inputTok = nextToken(input)
  }

  assert.is(inputTok.token, token)
  assert.is(inputTok.coding, coding)
}

const variables = [
  'A',
  'AAA',
  'ASCEND',
  'a',
  'aaa',
  'A0',
  'a0',
  'a_0',
  'a_hello',
  'HelloWorld',
  'hello_world'
]

for (const variable of variables) {
  test(`variable - ${variable}`, () => { testToken(variable, 'variable-number') })
  test(`variable - ${variable}$`, () => { testToken(`${variable}$`, 'variable-string') })
  test(`variable - ${variable}%`, () => { testToken(`${variable}%`, 'variable-integer') })
}

test('reserved - ASC', () => { testToken('ASC', 'function') })
test('reserved - Asc', () => { testToken('Asc', 'function', 'ASC') })
test('reserved - asc', () => { testToken('asc', 'function', 'ASC') })

test.run()
