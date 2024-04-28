import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import MockMachine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new MockMachine({ addScreen: true })
const inter = new Interpreter(machine)

const testCases = [
  { test: 'if 1 then', value: 1 },
  { test: 'if 0 then', value: 0 },
  { test: 'if 1 > 0 then', value: 1 },
  { test: 'if 1 < 0 then', value: 0 },
  { test: 'if 1 > 0 and 0 < 1 then', value: 1 },
  { test: 'if 1 > 0 and 0 > 1 then', value: 0 },
  { test: 'if 1 then:', value: 1 },
  { test: 'if 0 then:', value: 0 },
  { test: 'if 1 then r=3:', value: 1 },
  { test: 'if 0 then r=3:', value: 0 },
  { test: 'if "a"="a" then', value: 1 },
  { test: 'if "a"="b" then', value: 0 },
  { test: 'if "a"<>"a" then', value: 0 },
  { test: 'if "a"<>"b" then', value: 1 },
]

for (const testCase of testCases) {
  test(`${testCase.test}...`, async () => {
    const testCode = `r=0:${testCase.test} r=1`
    const result = await inter.interpretLine(testCode)

    assert.is(result.error, testCase.error)
    if (testCase.value) {
      let varD = { token: 'r', coding: 'variable-number', valueType: 'number' }
      assert.is(machine.variables.getValue(varD).value, 1)
    }
  })
}

test.run()