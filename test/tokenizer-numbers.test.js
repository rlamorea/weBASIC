import { test } from 'uvu';
import * as assert from 'uvu/assert';

import nextToken from '../scripts/interpreter/tokenizer.js'

function testToken(input, coding, expToken) {
  let inputTok = input
  let token = expToken
  if (typeof input === 'string' || input instanceof String) {
    token = input
    inputTok = nextToken(input)
  }

  assert.is(inputTok.token, expToken || token)
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

const hexNumbers = {
  '$0': '0',
  '$00': '0',
  '$01': '1',
  '$a': '10',
  '$A': '10',
  '$ff': '255',
  '$FFFF': '65535'
}

for (const hexVal in hexNumbers) {
  test(`hex number - ${hexVal}`, () => { testToken(hexVal, 'number-literal', hexNumbers[hexVal]) })
}

test('naked $', () => {
  testToken('$', 'char')
})

test.run()
