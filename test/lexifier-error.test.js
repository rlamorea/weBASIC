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
  { category: 'assignment', test: 'a = "b"', error: 'Type Mismatch'},
  { category: 'assignment', test: 'a = b$', error: 'Type Mismatch'},
  { category: 'assignment', test: 'a = CHR$(5)', error: 'Type Mismatch'},
  { category: 'assignment', test: 'b$ = 2', error: 'Type Mismatch'},
  { category: 'assignment', test: 'b$ = a', error: 'Type Mismatch'},
  { category: 'assignment', test: 'b$ = ATN(5)', error: 'Type Mismatch'},
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

    assert.ok(result.error.startsWith(testCase.error))
  })
}

test.run()
