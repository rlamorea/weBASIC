import { test } from 'uvu';
import * as assert from 'uvu/assert';

import nextToken from '../scripts/tokenizer.js'

function testToken(input, coding, token) {
  let inputTok = input
  if (typeof input === 'string' || input instanceof String) {
    token = input
    inputTok = nextToken(input)
  }

  assert.is(inputTok.token, token)
  assert.is(inputTok.coding, coding)
}

const numbers = [
  '0',
  '1234',
  '01234',
  '.',
  '.02',
  '0.',
  '0.02',
  '00.02',
  '1E6',
  '.E6',
  '.02E6',
  '1E+2',
  '1E-2',
  '1E20',
  '1E02',
  '1e6',
]

for (const number of numbers) {
  test(`number - ${number}`, () => { testToken(number, 'number-literal') })
}

test.run()
