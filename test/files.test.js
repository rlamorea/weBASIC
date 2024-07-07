import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { ErrorCodes } from '../scripts/interpreter/errors.js'
import { compareTestString } from "./testHelpers.js";

import Machine from './mockMachine.js'

let machine = new Machine({addScreen: true, files: {
  '/': [ 'prog.bas', 'foobar', 'foobaz', 'fopbar' ],
  '/+foo': [ 'foobar', 'foobaz' ],
  '/-bar': [ 'foobar', 'fopbar' ],
  '/+foo-bar': [ 'foobar' ],
}})
machine.execution.addCodeLine(machine.runCodespace, -1, '10 PRINT "Hello World"')
machine.execution.addCodeLine(machine.runCodespace, -1, '20 GOTO 10')

test('CATALOG', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('CATALOG')

  assert.is(result.error, undefined)
  compareTestString('In /', machine.screenCells, 0, 5)
  compareTestString('  prog.bas', machine.screenCells, 40, 10)
  compareTestString('  foobar', machine.screenCells, 80, 10)
  compareTestString('  foobaz', machine.screenCells, 120, 10)
  compareTestString('  fopbar', machine.screenCells, 160, 10)
})

test('CATALOG "/"', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('CATALOG "/"')

  assert.is(result.error, undefined)
  compareTestString('In /', machine.screenCells, 0, 5)
  compareTestString('  prog.bas', machine.screenCells, 40, 10)
  compareTestString('  foobar', machine.screenCells, 80, 10)
  compareTestString('  foobaz', machine.screenCells, 120, 10)
  compareTestString('  fopbar', machine.screenCells, 160, 10)
})

test('CATALOG "/", "foo"', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('CATALOG "/", "foo"')

  assert.is(result.error, undefined)
  // NOTE: odd path is artifact of mock
  compareTestString('In /+foo', machine.screenCells, 0, 5)
  compareTestString('  foobar', machine.screenCells, 40, 10)
  compareTestString('  foobaz', machine.screenCells, 80, 10)
  compareTestString('', machine.screenCells, 120, 10)
})

test('CATALOG "/", , "bar"', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('CATALOG "/", , "bar"')

  assert.is(result.error, undefined)
  // NOTE: odd path is artifact of mock
  compareTestString('In /-bar', machine.screenCells, 0, 5)
  compareTestString('  foobar', machine.screenCells, 40, 10)
  compareTestString('  fopbar', machine.screenCells, 80, 10)
  compareTestString('', machine.screenCells, 120, 10)
})

test('CATALOG "/", "foo", "bar"', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('CATALOG "/", "foo", "bar"')

  assert.is(result.error, undefined)
  // NOTE: odd path is artifact of mock
  compareTestString('In /+foo-bar', machine.screenCells, 0, 5)
  compareTestString('  foobar', machine.screenCells, 40, 10)
  compareTestString('', machine.screenCells, 80, 10)
})

// TODO: test catalog pagination

test('SAVE - error', async () => {
  machine.currentScreen.clearViewport()
  const result = await machine.runLiveCode('SAVE')

  assert.is(result.error, ErrorCodes.NO_FILE)
})

test('SAVE "backup.bas"', async () => {
  const result = await machine.runLiveCode('SAVE "backup.bas"')

  assert.is(result.error, undefined)
  compareTestString('File Saved', machine.screenCells, 0, 20)
  assert.is(machine.fileSystem.fsContents['/backup.bas'], '10 PRINT "Hello World"\n20 GOTO 10')
})

test('SAVE "prog"', async () => {
  const result = await machine.runLiveCode('SAVE "prog"')

  assert.is(result.error, undefined)
  compareTestString('File Saved', machine.screenCells, 0, 20)
  assert.is(machine.fileSystem.fsContents['/prog.bas'], '10 PRINT "Hello World"\n20 GOTO 10')
  assert.is(machine.fileSystem.currentFile, '/prog.bas')
})

test('LOAD "backup.bas"', async () => {
  await machine.runLiveCode('NEW')
  assert.is(machine.runCodespace.lineNumbers.length, 0)
  const result = await machine.runLiveCode('LOAD "backup.bas"')

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.lineNumbers.length, 2)
  assert.is(machine.runCodespace.codeLines[10].text, '10 PRINT "Hello World"')
  assert.is(machine.fileSystem.currentFile, '/backup.bas')
})

test('LOAD "prog"', async () => {
  await machine.runLiveCode('NEW')
  assert.is(machine.runCodespace.lineNumbers.length, 0)
  const result = await machine.runLiveCode('LOAD "prog"')

  assert.is(result.error, undefined)
  assert.is(machine.runCodespace.lineNumbers.length, 2)
  assert.is(machine.runCodespace.codeLines[10].text, '10 PRINT "Hello World"')
  assert.is(machine.fileSystem.currentFile, '/prog.bas')
})

test('SAVE', async () => {
  machine.execution.addCodeLine(machine.runCodespace, -1, '10 PRINT "HELLO WORLD!"')
  const result = await machine.runLiveCode('SAVE')

  assert.is(result.error, undefined)
  assert.is(machine.fileSystem.fsContents['/prog.bas'], '10 PRINT "HELLO WORLD!"\n20 GOTO 10')
})

test('SETDIR "/mop', async () => {
  const result = await machine.runLiveCode('SETDIR "/mop')

  assert.is(result.error, undefined)
  assert.is(machine.fileSystem.currentDir, '/mop/')
  await machine.runLiveCode('SETDIR "/"') // clean it up
})

test('COPY "prog.bas", "prog1.bas"', async () => {
  const result = await machine.runLiveCode('COPY "backup.bas", "prog1.bas"')

  assert.is(result.error, undefined)
  assert.is(machine.fileSystem.fsContents['/prog1.bas'], '10 PRINT "Hello World"\n20 GOTO 10')
})

test('RENAME "backup.bas", "old.bas"', async () => {
  const result = await machine.runLiveCode('RENAME "backup.bas", "old.bas"')

  assert.is(result.error, undefined)
  assert.is(machine.fileSystem.fsContents['/backup.bas'], undefined)
  assert.is(machine.fileSystem.fsContents['/old.bas'], '10 PRINT "Hello World"\n20 GOTO 10')
})

test('SCRATCH "old.bas"', async () => {
  const result = await machine.runLiveCode('SCRATCH "old.bas"')

  assert.is(result.error, undefined)
  assert.is(machine.fileSystem.fsContents['/old.bas'], undefined)
})

test.run()

