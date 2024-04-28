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

function sendToInput(machine, string) {
  if (machine.io.activeListener) {
    for (const ch of string) {
      machine.io.activeListener.handleKey({ key: ch })
    }
    machine.io.activeListener.handleKey({ key: 'Enter' })
  } else {
    setTimeout(() => { sendToInput(machine, string) }, 25 )
  }
}

function sendKey(machine, key, after = 0) {
  if (after > 0) {
    setTimeout( () => { sendKey(machine, key) }, after)
  } else if (machine.io.captureBreakKey || machine.io.captureCurrentKey) {
    machine.io.handleKeyDown({key: key})
  } else {
    setTimeout(() => { sendKey(machine, key) }, 25)
  }
}

export { tokens, precision, assertFloat, sendToInput, sendKey }
