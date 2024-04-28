import * as assert from 'uvu/assert';

import nextToken from "../scripts/interpreter/tokenizer.js";

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

function precision(x, digits = 4) {
  return x.toPrecision(digits)
}

function assertFloat(x, y, digits = 4) {
  assert.is(precision(x, digits), precision(y, digits))
}

export { tokens, precision, assertFloat }
