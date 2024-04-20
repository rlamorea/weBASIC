import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Machine from './mockMachine.js'

let machine = new Machine({addScreen: true})

test('setViewport dimensions', () => {
  assert.is(machine.screen.viewportSize[0], 40)
  assert.is(machine.screen.viewportSize[1], 10)
  assert.is(machine.screen.cellSize[0], 22)
  assert.is(machine.screen.cellSize[1], 45)
  assert.is(machine.screen.borderSize[0], 10)
  assert.is(machine.screen.borderSize[1], 100)
})

test('displayChar at home cursor', () => {
  assert.is(machine.screenCells[0].innerHTML, '')
  machine.screen.displayChar('A')
  assert.is(machine.screenCells[0].innerHTML, 'A')
})

test('move and displayChar', () => {
  machine.screen.moveTo([2, 2])
  machine.screen.displayChar('B')
  assert.is(machine.screenCells[machine.screen.viewportSize[0]+1].innerHTML, 'B')
  assert.is(machine.screen.viewportCursorLocation[0], 3)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
  assert.is(machine.screen.cursorLocation[0], 3)
  assert.is(machine.screen.cursorLocation[1], 2)
})

test('advance cursor by 1', () => {
  machine.screen.advanceCursor()
  assert.is(machine.screen.viewportCursorLocation[0], 4)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
  assert.is(machine.screen.cursorLocation[0], 4)
  assert.is(machine.screen.cursorLocation[1], 2)
})

test('advance cursor past end of line', () => {
  machine.screen.advanceCursor(37)
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 3)
})

test('displayCharAt', () => {
  machine.screen.displayCharAt([2, 1], 'C')
  assert.is(machine.screenCells[1].innerHTML, 'C')
  assert.is(machine.screen.viewportCursorLocation[0], 2)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('displayString', () => {
  machine.screen.displayString("Hello World", false)
  assert.is(machine.screenCells[1].innerHTML, 'H')
  assert.is(machine.screenCells[7].innerHTML, 'W')
  assert.is(machine.screenCells[11].innerHTML, 'd')
  assert.is(machine.screen.viewportCursorLocation[0], 13)
  assert.is(machine.screen.viewportCursorLocation[1], 1)
})

test('displayStringAt', () => {
  machine.screen.displayStringAt([1, 2], 'Goodbye', false)
  assert.is(machine.screenCells[40].innerHTML, 'G')
  assert.is(machine.screenCells[43].innerHTML, 'd')
  assert.is(machine.screenCells[46].innerHTML, 'e')
  assert.is(machine.screen.viewportCursorLocation[0], 8)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('displayStringAt wrap', () => {
  machine.screen.displayStringAt([39, 1], 'HiThere', false)
  assert.is(machine.screenCells[38].innerHTML, 'H')
  assert.is(machine.screenCells[39].innerHTML, 'i')
  assert.is(machine.screenCells[40].innerHTML, 'T')
  assert.is(machine.screenCells[44].innerHTML, 'e')
  assert.is(machine.screen.viewportCursorLocation[0], 6)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('home and displayString w/newline', () => {
  machine.screen.home()
  machine.screen.displayString("Hello World")
  assert.is(machine.screenCells[0].innerHTML, 'H')
  assert.is(machine.screenCells[6].innerHTML, 'W')
  assert.is(machine.screenCells[10].innerHTML, 'd')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 2)
})

test('displayStringAt w/newline', () => {
  machine.screen.displayStringAt([1, 2], 'Goodbye')
  assert.is(machine.screenCells[40].innerHTML, 'G')
  assert.is(machine.screenCells[43].innerHTML, 'd')
  assert.is(machine.screenCells[46].innerHTML, 'e')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 3)
})

test('displayStringAt wrap w/newline', () => {
  machine.screen.displayStringAt([39, 1], 'HiThere')
  assert.is(machine.screenCells[38].innerHTML, 'H')
  assert.is(machine.screenCells[39].innerHTML, 'i')
  assert.is(machine.screenCells[40].innerHTML, 'T')
  assert.is(machine.screenCells[44].innerHTML, 'e')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 3)
})

test('linesRequiresFrom - 1 line', () => {
  const lr = machine.screen.linesRequiredFrom([1, 1], 11)
  assert.is(lr, 1)
})

test('linesRequiresFrom - 1 full line', () => {
  const lr = machine.screen.linesRequiredFrom([1, 1], 40)
  assert.is(lr, 1)
})

test('linesRequiresFrom - long line', () => {
  const lr = machine.screen.linesRequiredFrom([1, 1], 41)
  assert.is(lr, 2)
})

test('linesRequiresFrom - overflow full line', () => {
  const lr = machine.screen.linesRequiredFrom([2, 1], 40)
  assert.is(lr, 2)
})

test('clearViewport', () => {
  machine.screen.clearViewport()
  assert.is(machine.screenCells[0].innerHTML, '')
  assert.is(machine.screenCells[40].innerHTML, '')
  assert.is(machine.screenCells[80].innerHTML, '')
  assert.is(machine.screenCells[120].innerHTML, '')
})

test('scrollBy - down 2', () => {
  machine.screen.displayStringAt([ 1, 3 ], 'Hello World')
  machine.screen.scrollBy(0, -2)
  assert.is(machine.screenCells[0].innerHTML, 'H')
  assert.is(machine.screenCells[6].innerHTML, 'W')
  assert.is(machine.screenCells[10].innerHTML, 'd')
})

test('scrollBy - up 2', () => {
  machine.screen.scrollBy(0, 2)
  assert.is(machine.screenCells[0].innerHTML, '')
  assert.is(machine.screenCells[80].innerHTML, 'H')
  assert.is(machine.screenCells[86].innerHTML, 'W')
  assert.is(machine.screenCells[90].innerHTML, 'd')
})

test('newline at end of screen', () => {
  machine.screen.displayStringAt([ 1, 10 ], 'Hello World', false)
  machine.screen.newline()
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 10)
  assert.is(machine.screenCells[320].innerHTML, 'H')
  assert.is(machine.screenCells[326].innerHTML, 'W')
  assert.is(machine.screenCells[330].innerHTML, 'd')
})

test('display string wrap with newline', () => {
  machine.screen.clearViewport()
  machine.screen.displayStringAt([ 35, 10], 'Hello World')
  assert.is(machine.screen.viewportCursorLocation[0], 1)
  assert.is(machine.screen.viewportCursorLocation[1], 10)
  assert.is(machine.screenCells[314].innerHTML, 'H')
  assert.is(machine.screenCells[320].innerHTML, 'W')
  assert.is(machine.screenCells[324].innerHTML, 'd')
})

test('ensureLines - no change', () => {
  machine.screen.clearViewport()
  machine.screen.displayStringAt([ 1, 8 ], 'Hello World')
  machine.screen.ensureLines(2)
  assert.is(machine.screenCells[280].innerHTML, 'H')
  assert.is(machine.screenCells[286].innerHTML, 'W')
  assert.is(machine.screenCells[290].innerHTML, 'd')
})

test('ensureLines - scroll', () => {
  machine.screen.clearViewport()
  machine.screen.displayStringAt([ 1, 9 ], 'Hello World')
  machine.screen.ensureLines(2)
  assert.is(machine.screenCells[280].innerHTML, 'H')
  assert.is(machine.screenCells[286].innerHTML, 'W')
  assert.is(machine.screenCells[290].innerHTML, 'd')
})

test('ensureLines - scroll from bottom', () => {
  machine.screen.clearViewport()
  machine.screen.displayStringAt([ 1, 10 ], 'Hello World', false)
  machine.screen.ensureLines(2)
  assert.is(machine.screenCells[280].innerHTML, 'H')
  assert.is(machine.screenCells[286].innerHTML, 'W')
  assert.is(machine.screenCells[290].innerHTML, 'd')
})

test.run()