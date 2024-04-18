import { test } from 'uvu';
import * as assert from 'uvu/assert';

import CharGridScreen from '../scripts/screens/charGridScreen.js';

// build mocks
global.window = {
  innerWidth: 900, innerHeight: 650,
  getComputedStyle: (div, x) => {
    return { getPropertyValue: (p) => { return 'black' } }
  }
}

global.document = {
  createElement: (tag) => { return { innerHTML: '', dataset: { }, classList: { add: (x) => { /* do nothing */ } } } },
  adoptedStyleSheets: [ { replace: (x) => { /* do nothing */ }} ]
}

let refCell = {
  offsetWidth: 12, offsetHeight: 24,
  remove: () => { /* do nothing */ }
}

let screenCells = []

let div = {
  style: {},
  appendChild: (ch) => { screenCells.push(ch) },
  dispatchEvent: (x) => { /* do nothing */ },
  querySelector: (x) => {
    const m = x.match(/\[data-column="(\d+)"\]\[data-row="(\d+)"\]/)
    const idx = (parseInt(m[2]) - 1) * screen.viewportSize[0] + (parseInt(m[1]) - 1)
    return screenCells[idx]
  },
  querySelectorAll: (x) => { return screenCells }
}

const screen = new CharGridScreen('fixed-test', div, { refCell });

function pauseToAllowSetup() {
  return new Promise((resolve) => { setTimeout(() => { resolve(1) , 500 } ) } )
}

await pauseToAllowSetup()

test('setViewport dimensions', () => {
  assert.is(screen.viewportSize[0], 40)
  assert.is(screen.viewportSize[1], 10)
  assert.is(screen.cellSize[0], 22)
  assert.is(screen.cellSize[1], 45)
  assert.is(screen.borderSize[0], 10)
  assert.is(screen.borderSize[1], 100)
})

test('displayChar at home cursor', () => {
  assert.is(screenCells[0].innerHTML, '')
  screen.displayChar('A')
  assert.is(screenCells[0].innerHTML, 'A')
})

test('move and displayChar', () => {
  screen.moveTo([2, 2])
  screen.displayChar('B')
  assert.is(screenCells[screen.viewportSize[0]+1].innerHTML, 'B')
  assert.is(screen.viewportCursorLocation[0], 3)
  assert.is(screen.viewportCursorLocation[1], 2)
  assert.is(screen.cursorLocation[0], 3)
  assert.is(screen.cursorLocation[1], 2)
})

test('advance cursor by 1', () => {
  screen.advanceCursor()
  assert.is(screen.viewportCursorLocation[0], 4)
  assert.is(screen.viewportCursorLocation[1], 2)
  assert.is(screen.cursorLocation[0], 4)
  assert.is(screen.cursorLocation[1], 2)
})

test('advance cursor past end of line', () => {
  screen.advanceCursor(37)
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 3)
})

test('displayCharAt', () => {
  screen.displayCharAt([2, 1], 'C')
  assert.is(screenCells[1].innerHTML, 'C')
  assert.is(screen.viewportCursorLocation[0], 2)
  assert.is(screen.viewportCursorLocation[1], 1)
})

test('displayString', () => {
  screen.displayString("Hello World", false)
  assert.is(screenCells[1].innerHTML, 'H')
  assert.is(screenCells[7].innerHTML, 'W')
  assert.is(screenCells[11].innerHTML, 'd')
  assert.is(screen.viewportCursorLocation[0], 13)
  assert.is(screen.viewportCursorLocation[1], 1)
})

test('displayStringAt', () => {
  screen.displayStringAt([1, 2], 'Goodbye', false)
  assert.is(screenCells[40].innerHTML, 'G')
  assert.is(screenCells[43].innerHTML, 'd')
  assert.is(screenCells[46].innerHTML, 'e')
  assert.is(screen.viewportCursorLocation[0], 8)
  assert.is(screen.viewportCursorLocation[1], 2)
})

test('displayStringAt wrap', () => {
  screen.displayStringAt([39, 1], 'HiThere', false)
  assert.is(screenCells[38].innerHTML, 'H')
  assert.is(screenCells[39].innerHTML, 'i')
  assert.is(screenCells[40].innerHTML, 'T')
  assert.is(screenCells[44].innerHTML, 'e')
  assert.is(screen.viewportCursorLocation[0], 6)
  assert.is(screen.viewportCursorLocation[1], 2)
})

test('home and displayString w/newline', () => {
  screen.home()
  screen.displayString("Hello World")
  assert.is(screenCells[0].innerHTML, 'H')
  assert.is(screenCells[6].innerHTML, 'W')
  assert.is(screenCells[10].innerHTML, 'd')
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 2)
})

test('displayStringAt w/newline', () => {
  screen.displayStringAt([1, 2], 'Goodbye')
  assert.is(screenCells[40].innerHTML, 'G')
  assert.is(screenCells[43].innerHTML, 'd')
  assert.is(screenCells[46].innerHTML, 'e')
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 3)
})

test('displayStringAt wrap w/newline', () => {
  screen.displayStringAt([39, 1], 'HiThere')
  assert.is(screenCells[38].innerHTML, 'H')
  assert.is(screenCells[39].innerHTML, 'i')
  assert.is(screenCells[40].innerHTML, 'T')
  assert.is(screenCells[44].innerHTML, 'e')
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 3)
})

test('linesRequiresFrom - 1 line', () => {
  const lr = screen.linesRequiredFrom([1, 1], 11)
  assert.is(lr, 1)
})

test('linesRequiresFrom - 1 full line', () => {
  const lr = screen.linesRequiredFrom([1, 1], 40)
  assert.is(lr, 1)
})

test('linesRequiresFrom - long line', () => {
  const lr = screen.linesRequiredFrom([1, 1], 41)
  assert.is(lr, 2)
})

test('linesRequiresFrom - overflow full line', () => {
  const lr = screen.linesRequiredFrom([2, 1], 40)
  assert.is(lr, 2)
})

test('clearViewport', () => {
  screen.clearViewport()
  assert.is(screenCells[0].innerHTML, '')
  assert.is(screenCells[40].innerHTML, '')
  assert.is(screenCells[80].innerHTML, '')
  assert.is(screenCells[120].innerHTML, '')
})

test('scrollBy - down 2', () => {
  screen.displayStringAt([ 1, 3 ], 'Hello World')
  screen.scrollBy(0, -2)
  assert.is(screenCells[0].innerHTML, 'H')
  assert.is(screenCells[6].innerHTML, 'W')
  assert.is(screenCells[10].innerHTML, 'd')
})

test('scrollBy - up 2', () => {
  screen.scrollBy(0, 2)
  assert.is(screenCells[0].innerHTML, '')
  assert.is(screenCells[80].innerHTML, 'H')
  assert.is(screenCells[86].innerHTML, 'W')
  assert.is(screenCells[90].innerHTML, 'd')
})

test('newline at end of screen', () => {
  screen.displayStringAt([ 1, 10 ], 'Hello World', false)
  screen.newline()
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 10)
  assert.is(screenCells[320].innerHTML, 'H')
  assert.is(screenCells[326].innerHTML, 'W')
  assert.is(screenCells[330].innerHTML, 'd')
})

test('display string wrap with newline', () => {
  screen.clearViewport()
  screen.displayStringAt([ 35, 10], 'Hello World')
  assert.is(screen.viewportCursorLocation[0], 1)
  assert.is(screen.viewportCursorLocation[1], 10)
  assert.is(screenCells[314].innerHTML, 'H')
  assert.is(screenCells[320].innerHTML, 'W')
  assert.is(screenCells[324].innerHTML, 'd')
})

test('ensureLines - no change', () => {
  screen.clearViewport()
  screen.displayStringAt([ 1, 8 ], 'Hello World')
  screen.ensureLines(2)
  assert.is(screenCells[280].innerHTML, 'H')
  assert.is(screenCells[286].innerHTML, 'W')
  assert.is(screenCells[290].innerHTML, 'd')
})

test('ensureLines - scroll', () => {
  screen.clearViewport()
  screen.displayStringAt([ 1, 9 ], 'Hello World')
  screen.ensureLines(2)
  assert.is(screenCells[280].innerHTML, 'H')
  assert.is(screenCells[286].innerHTML, 'W')
  assert.is(screenCells[290].innerHTML, 'd')
})

test('ensureLines - scroll from bottom', () => {
  screen.clearViewport()
  screen.displayStringAt([ 1, 10 ], 'Hello World', false)
  screen.ensureLines(2)
  assert.is(screenCells[280].innerHTML, 'H')
  assert.is(screenCells[286].innerHTML, 'W')
  assert.is(screenCells[290].innerHTML, 'd')
})

test.run()