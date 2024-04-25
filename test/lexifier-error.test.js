import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'

const machine = new Machine();

import nextToken from '../scripts/interpreter/tokenizer.js'
import Lexifier from '../scripts/interpreter/lexifier.js'
import { tokens } from './testHelpers.js'

const lex = new Lexifier()

const testCases = [
  { category: 'paren', test: '(', error: ErrorCodes.UNCLOSED_PAREN },
  { category: 'paren', test: '(255', error: ErrorCodes.UNCLOSED_PAREN },
  { category: 'paren', test: '(255 - 10', error: ErrorCodes.UNCLOSED_PAREN },
  { category: 'paren', test: '(255 - (10 + foo)', error: ErrorCodes.UNCLOSED_PAREN },
  { category: 'paren', test: '((255 - 10) + foo', error: ErrorCodes.UNCLOSED_PAREN },
  { category: 'param', test: '0,,0', error: ErrorCodes.ILLEGAL_VALUE },
  { category: 'param', test: 'PRINT', error: ErrorCodes.SYNTAX },
  { category: 'param', test: '1, PRINT', error: ErrorCodes.SYNTAX },
  { category: 'expression', test: 'PRINT', error: ErrorCodes.SYNTAX },
  { category: 'expression', test: '- "hello"', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: '"hello" - " world"', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: '2 + "hello"', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: '3 + CHR$(255)', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: 'CHR$(255) + 3', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: '3 + variable$', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: 'variable$ + 3', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: '"hello " + variable', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: 'variable% + "hello', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'expression', test: 'variable% + ', error: ErrorCodes.SYNTAX },
  { category: 'expression', test: '"string" "string"', error: ErrorCodes.SYNTAX },
  { category: 'assignment', test: 'a = "b"', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'assignment', test: 'a = b$', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'assignment', test: 'a = CHR$(5)', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'assignment', test: 'b$ = 2', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'assignment', test: 'b$ = a', error: ErrorCodes.TYPE_MISMATCH },
  { category: 'assignment', test: 'b$ = ATN(5)', error: ErrorCodes.TYPE_MISMATCH },
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
    } else if (testCase.category === 'expression') {
      result = lex.parseExpression(t,t[0].tokenStart)
    } else { // assignment
      let v = t.shift()
      result = lex.lexifyAssignment(v, t)
    }

    assert.is(result.error, testCase.error)
  })
}

test.run()
