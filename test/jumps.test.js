import { test } from 'uvu';
import * as assert from 'uvu/assert';
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import {compareTestString, runProgram} from "./testHelpers.js";

import MockMachine from './mockMachine.js'
import Lexifier from '../scripts/interpreter/lexifier.js'

const machine = new MockMachine({ addScreen: true })
const lexifier = new Lexifier()

test('GOTO a line', async () => {
  const result = await runProgram(machine, [
    '10 a=1:GOTO 30',
    '20 a=2',
    '30 PRINT a'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '1')
  assert.is(machine.variables.variableLookup['a'].value, 1)
})

test('GOTO unknown line', async() => {
  const result = await runProgram(machine, [
    '10 a=1:GOTO 30',
    '20 a=2'
  ])

  assert.is(result.error, ErrorCodes.UNKNOWN_LINE + ' 30')
})

test('GOSUB/RETURN', async() => {
  const result = await runProgram(machine, [
    '10 a=1:GOSUB 100',
    '20 a=2:GOSUB 100',
    '30 END',
    '100 PRINT a',
    '110 RETURN'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '1')
  assert.is(machine.screenCells[40].innerHTML, '2')
})

test('nested GOSUB', async () => {
  const result = await runProgram(machine, [
    '10 a=2:GOSUB 100',
    '20 a=3:GOSUB 100',
    '30 END',
    '100 b=a*a:GOSUB 200:RETURN',
    '200 PRINT b:RETURN'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '4')
  assert.is(machine.screenCells[40].innerHTML, '9')
})

test('naked RETURN', async () => {
  const result = await runProgram(machine, [
    '10 a=2:GOSUB 100',
    '100 PRINT a:RETURN'
  ])

  assert.is(result.error, ErrorCodes.UNEXPECTED_RETURN)
  assert.is(machine.screenCells[0].innerHTML, '2')
})

test('calculated GOTO', async () => {
  const result = await runProgram(machine, [
    '10 a=30:GOTO a',
    '20 END',
    '30 PRINT a'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '3')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('calculated GOTO math', async() => {
  const result = await runProgram(machine, [
    '10 a=20:b=10:goto a+b',
    '20 end',
    '30 PRINT a'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('calculated GOTO - error', async () => {
  const result = await runProgram(machine, [
    '10 a=20:b=20:goto a+b',
    '20 end',
    '30 PRINT a'
  ])

  assert.is(result.error, ErrorCodes.UNKNOWN_LINE + ' 40')
})

test('calculated GOSUB', async () => {
  const result = await runProgram(machine, [
    '10 a=20:b=10:GOSUB a+b',
    '20 END',
    '30 PRINT a:RETURN'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('ON GOTO 1st', async () => {
  const result = await runProgram(machine, [
    '10 a=1:ON a GOTO 20,30,40:END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '2')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('ON GOTO 2nd', async () => {
  const result = await runProgram(machine, [
    '10 a=2:ON a GOTO 20,30,40:END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '3')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('ON GOTO 3rd', async () => {
  const result = await runProgram(machine, [
    '10 a=3:ON a GOTO 20,30,40:END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '4')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('ON GOTO 0th', async () => {
  const result = await runProgram(machine, [
    '10 a=0:ON a GOTO 20,30,40:PRINT "NO":END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'N')
  assert.is(machine.screenCells[1].innerHTML, 'O')
})

test('ON GOTO 4th', async () => {
  const result = await runProgram(machine, [
    '10 a=4:ON a GOTO 20,30,40:PRINT "NO":END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, 'N')
  assert.is(machine.screenCells[1].innerHTML, 'O')
})

test('ON GOTO calc', async () => {
  const result = await runProgram(machine, [
    '10 a=1:b=1:ON a+b GOTO 20,30,40:PRINT "NO":END',
    '20 PRINT "20"',
    '30 PRINT "30"',
    '40 PRINT "40"'
  ])

  assert.is(result.error, undefined)
  assert.is(machine.screenCells[0].innerHTML, '3')
  assert.is(machine.screenCells[1].innerHTML, '0')
})

test('ON GOSUB 2nd', async () => {
  const result = await runProgram(machine, [
    '10 a=2:ON a GOSUB 20,30,40:PRINT " world":END',
    '20 PRINT "hello";:RETURN',
    '30 PRINT "hi";:RETURN',
    '40 PRINT "hiya";:RETURN'
  ])

  assert.is(result.error, undefined)
  compareTestString('hi world', machine.screenCells, 0, 40)
})

test.run()