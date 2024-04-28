import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'

import Machine from './mockMachine.js'
import Interpreter from "../scripts/interpreter/interpreter.js";

const machine = new Machine({ addScreen: true })
const inter = new Interpreter(machine)

test('def fn foo(x)=1', async () => {
  const result = await inter.interpretLine('def fn foo(x)=1')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['foo'].valueType, 'function')
})

test('a=fn foo(5)', async () => {
  const result = await inter.interpretLine('a=fn foo(5)')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('def fn f2(x)=x+2:a = fn f2(5)', async () => {
  const result = await inter.interpretLine('def fn f2(x)=x+2:a = fn f2(5)')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 7)
})

test('x=33:def fn f3(x)=x*x:a = fn f3(5)', async () => {
  const result = await inter.interpretLine('x=33:def fn f3(x)=x*x:a = fn f3(5)')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 25)
  assert.is(machine.variables.variableLookup['x'].value, 33)
})

test('def fn f4(x,y)=x+y:a = fn f4(5,4)', async () => {
  const result = await inter.interpretLine('def fn f4(x,y)=x+y:a = fn f4(5,4)')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 9)
})

test('def fn f5$(x$)=x$+" world":b$ = fn f5$("hello")', async () => {
  const result = await inter.interpretLine('def fn f5$(x$)=x$+" world":b$ = fn f5$("hello")')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['b$'].valueType, 'string')
  assert.is(machine.variables.variableLookup['b$'].value, 'hello world')
})

test('def fn f6%(x)=x+0.5:a = fn f6%(3)', async () => {
  const result = await inter.interpretLine('def fn f6%(x)=x+0.5:a = fn f6%(3)')

  assert.is(result.error, undefined)
  assert.is(machine.variables.variableLookup['a'].valueType, 'number')
  assert.is(machine.variables.variableLookup['a'].value, 3)
})

test('def foo(b)=1', async () => {
  const result = await inter.interpretLine('def foo(b)=1')

  assert.is(result.error, ErrorCodes.SYNTAX)
})

test('def fn foo(b)=1', async () => {
  const result = await inter.interpretLine('def fn foo(b)=1')

  assert.is(result.error, ErrorCodes.ILLEGAL_REASSIGN)
})

test('a = fn foobar(7)', async () => {
  const result = await inter.interpretLine('a = fn foobar(7)')

  assert.is(result.error, ErrorCodes.UNDEF_FUNCTION)
})

test('b$ = fn foo(7)', async () => {
  const result = await inter.interpretLine('b$ = fn foo(7)')

  assert.is(result.error, ErrorCodes.TYPE_MISMATCH)
})

test('a = fn foo("a")', async () => {
  const result = await inter.interpretLine('a = fn foo("a")')

  assert.is(result.error, ErrorCodes.TYPE_MISMATCH)
})

test('def fn a(x)=x+1', async () => {
  const result = await inter.interpretLine('def fn a(x)=x+1')

  assert.is(result.error, ErrorCodes.ILLEGAL_REASSIGN)
})

test.run()