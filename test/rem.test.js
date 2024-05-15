import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import { runProgram } from "./testHelpers.js";

import MockMachine from './mockMachine.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

const machine = new MockMachine({ addScreen: true })
const lexifier = new Lexifier()

test('parse command REM - error', () => {
  const result = lexifier.lexifyLine('REM test')

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('parse command back-tick - error', () => {
  const result = lexifier.lexifyLine('` test')

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('parse full line REM', () => {
  const result = lexifier.lexifyLine('10 REM test', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
})

test('parse full line back-tick', () => {
  const result = lexifier.lexifyLine('10 ` test', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 1)
})

test('parse end-of-line REM', () => {
  const result = lexifier.lexifyLine('10 a=1:REM test', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 2)
})

test('parse end-of-line back-tick', () => {
  const result = lexifier.lexifyLine('10 a=1:` test', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 2)
})

test('parse end-of-line REM with colons', () => {
  const result = lexifier.lexifyLine('10 a=1:REM test:a=2', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 2)
})

test('parse end-of-line back-tick with colons', () => {
  const result = lexifier.lexifyLine('10 a=1:` test:a=2', true)

  assert.is(result.error, undefined)
  assert.is(result.lineStatements.length, 2)
})

test('full line REM in program', async () => {
  const result = await runProgram(machine, [ '10 REM nothing', '20 a=1' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('full line back-tick in program', async () => {
  const result = await runProgram(machine, [ '10 ` nothing', '20 a=1' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('end-of-line REM in program', async () => {
  const result = await runProgram(machine, [ '10 a=1:REM nothing', '20 a=2' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 2)
})

test('end-of-line line back-tick in program', async () => {
  const result = await runProgram(machine, [ '10 a=1:` nothing', '20 a=2' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 2)
})

test('end-of-line REM with colon in program', async () => {
  const result = await runProgram(machine, [ '10 a=1:REM nothing:a=2' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('end-of-line back-tick with colon in program', async () => {
  const result = await runProgram(machine, [ '10 a=1:` nothing:a=2' ])

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test.run()