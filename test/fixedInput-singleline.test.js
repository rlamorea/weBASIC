import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { testString, compareTestString } from "./testHelpers.js"

import Machine from './mockMachine.js'
import FixedInput from '../scripts/machine/screens/fixedInput.js'

let machine = new Machine({ addScreen: true })

let input = null

function enterKey(char, controls = {}, inp = input) {
  const evt = { key: char, ...controls }
  inp.handleKey(evt)
}

function enterString(str, inp = input) {
  for (const char of str) { enterKey(char, {}, inp) }
}

function repeatKey(char, count, inp = input, controls = {}) {
  for (let i = 0; i < count; i++) { enterKey(char, controls, inp) }
}

// test our logic function - showSingleLineViewport
test('logic - empty string', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 3])
  const inp = new FixedInput(machine.currentScreen, { singleLine: true })
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 3)
  assert.is(inp.inputText, '')
  inp.showSingleLineViewPort('', 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 3)
  assert.is(inp.inputText, '')
  inp.activate(false)
})

test('logic - sub-window string', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 10])
  // insert and cursor eol
  const inp = new FixedInput(machine.currentScreen, { singleLine: true })
  inp.showSingleLineViewPort('hello world', 11)
  assert.is(inp.cursorLocation[0], 12)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hello world')
  compareTestString('hello world', machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort('hello world', 10)
  assert.is(inp.cursorLocation[0], 11)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hello world')
  compareTestString('hello world', machine.screenCells, 360, 40)
  // sol
  inp.showSingleLineViewPort('hello world', 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hello world')
  compareTestString('hello world', machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort('hello world', 1)
  assert.is(inp.cursorLocation[0], 2)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hello world')
  compareTestString('hello world', machine.screenCells, 360, 40)
  // delete end
  inp.showSingleLineViewPort('hello worl', 10)
  assert.is(inp.cursorLocation[0], 11)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hello worl')
  compareTestString('hello worl', machine.screenCells, 360, 40)
  // delete middle
  inp.showSingleLineViewPort('hell worl', 4)
  assert.is(inp.cursorLocation[0], 5)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, 'hell worl')
  compareTestString('hell worl', machine.screenCells, 360, 40)
  inp.activate(false)
})

test('logic - at-window string - 1', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 10])
  let str = testString(39)
  const inp = new FixedInput(machine.currentScreen, { singleLine: true })
  // insert and eol
  inp.showSingleLineViewPort(str, 39)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 38)
  assert.is(inp.cursorLocation[0], 39)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // sol
  inp.showSingleLineViewPort(str, 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort(str, 1)
  assert.is(inp.cursorLocation[0], 2)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // delete end
  inp.showSingleLineViewPort(str.substring(0, 38), 38)
  assert.is(inp.cursorLocation[0], 39)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str.substring(0, 38))
  compareTestString(str.substring(0, 38), machine.screenCells, 360, 40)
  // delete middle
  let newStr = str.substring(0, 10) + str.substring(11)
  inp.showSingleLineViewPort(newStr, 10)
  assert.is(inp.cursorLocation[0], 11)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, newStr)
  compareTestString(newStr, machine.screenCells, 360, 40)
  inp.activate(false)
})

test('logic - at-window string', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 10])
  const str = testString(40)
  const inp = new FixedInput(machine.currentScreen, { singleLine: true })
  // insert and eol
  inp.showSingleLineViewPort(str, 40)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(1), machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 39)
  assert.is(inp.cursorLocation[0], 39)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(1), machine.screenCells, 360, 40)
  // sol
  inp.showSingleLineViewPort(str, 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort(str, 1)
  assert.is(inp.cursorLocation[0], 2)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // width right
  inp.showSingleLineViewPort(str, 39)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str, machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort(str, 40)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(1), machine.screenCells, 360, 40)
  // delete end
  inp.showSingleLineViewPort(str.substring(0, 39), 39)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str.substring(0, 39))
  compareTestString(str.substring(0, 39), machine.screenCells, 360, 40)
  // delete middle
  let newStr = str.substring(0, 10) + str.substring(11)
  inp.showSingleLineViewPort(newStr, 10)
  assert.is(inp.cursorLocation[0], 11)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, newStr)
  compareTestString(newStr, machine.screenCells, 360, 40)
  inp.activate(false)
})

test('logic - over-window string', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 10])
  const str = testString(100)
  const inp = new FixedInput(machine.currentScreen, { singleLine: true })
  // insert and eol
  inp.showSingleLineViewPort(str, 100)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(61), machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 99)
  assert.is(inp.cursorLocation[0], 39)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(61), machine.screenCells, 360, 40)
  // start of window
  inp.showSingleLineViewPort(str, 61)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(61), machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 60)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(60), machine.screenCells, 360, 40)
  // sol
  inp.showSingleLineViewPort(str, 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(0, 40), machine.screenCells, 360, 40)
  // end of window
  inp.showSingleLineViewPort(str, 39)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(0, 40), machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort(str, 40)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(1, 41), machine.screenCells, 360, 40)
  // end of string
  inp.showSingleLineViewPort(str, 99)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(60, 100), machine.screenCells, 360, 40)
  // one right to cursor gap
  inp.showSingleLineViewPort(str, 100)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(61), machine.screenCells, 360, 40)
  // delete end
  inp.showSingleLineViewPort(str.substring(0, 99), 99)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str.substring(0, 99))
  compareTestString(str.substring(60, 99), machine.screenCells, 360, 40)
  // delete middle
  let newStr = str.substring(0, 10) + str.substring(11)
  inp.showSingleLineViewPort(newStr, 10)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, newStr)
  compareTestString(newStr.substring(10, 50), machine.screenCells, 360, 40)
  inp.activate(false)
})

test('logic - at-max string', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([1, 10])
  const str = testString(160)
  const inp = new FixedInput(machine.currentScreen, {singleLine: true})
  // insert and eol
  inp.showSingleLineViewPort(str, 159)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(120), machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 158)
  assert.is(inp.cursorLocation[0], 39)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(120), machine.screenCells, 360, 40)
  // start of window
  inp.showSingleLineViewPort(str, 120)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(120), machine.screenCells, 360, 40)
  // one left
  inp.showSingleLineViewPort(str, 119)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(119, 159), machine.screenCells, 360, 40)
  // sol
  inp.showSingleLineViewPort(str, 0)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(0, 40), machine.screenCells, 360, 40)
  // back to end of next-to-last window
  inp.showSingleLineViewPort(str, 119)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(80, 120), machine.screenCells, 360, 40)
  // one right
  inp.showSingleLineViewPort(str, 120)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(81, 121), machine.screenCells, 360, 40)
  // eol
  inp.showSingleLineViewPort(str, 159)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str)
  compareTestString(str.substring(120), machine.screenCells, 360, 40)
  // delete end
  inp.showSingleLineViewPort(str.substring(0, 159), 159)
  assert.is(inp.cursorLocation[0], 40)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, str.substring(0, 159))
  compareTestString(str.substring(120, 159), machine.screenCells, 360, 40)
  // delete middle
  let newStr = str.substring(0, 10) + str.substring(11)
  inp.showSingleLineViewPort(newStr, 10)
  assert.is(inp.cursorLocation[0], 1)
  assert.is(inp.cursorLocation[1], 10)
  assert.is(inp.inputText, newStr)
  compareTestString(newStr.substring(10, 50), machine.screenCells, 360, 40)
  inp.activate(false)
})

test('initialized', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.displayString('Input? ', false)
  input = new FixedInput(machine.currentScreen, { singleLine: true })
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.singleLineViewLength, 33) // number of cells
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('enter one char', () => {
  enterKey('A')
  assert.is(input.cursorLocation[0], 9)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'A')
  assert.is(machine.screenCells[7].innerHTML, 'A')
  assert.ok(machine.screenCells[8].classList.classes['cursor'])
})

test('backspace one char', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, '')
  assert.is(machine.screenCells[7].innerHTML, '')
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('backspace at start of line', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, '')
  assert.is(machine.screenCells[7].innerHTML, '')
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('enter string', () => {
  enterString('Here is a test')
  assert.is(input.cursorLocation[0], 22)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a test')
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(machine.screenCells[20].innerHTML, 't')
  assert.ok(machine.screenCells[21].classList.classes['cursor'])
})

test('backspace pulls cursor end in one', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 21)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a tes')
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(machine.screenCells[19].innerHTML, 's')
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 21)
})

test( 'left arrow', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 20)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a tes')
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(machine.screenCells[19].innerHTML, 's')
  assert.ok(machine.screenCells[19].classList.classes['cursor'])
})

test('right arrow at end with room', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 21)
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
})

test('right arrow at end of line', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 21)
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
})

test('alt-left arrow - back to start of word', () => {
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 18)
  assert.ok(machine.screenCells[17].classList.classes['cursor'])
})

test('alt-left arrow - back two words', () => {
  enterKey('ArrowLeft', { altKey: true })
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 13)
  assert.ok(machine.screenCells[12].classList.classes['cursor'])
})

test('alt-right arrow - fwd to end of word', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 15)
  assert.ok(machine.screenCells[14].classList.classes['cursor'])
})

test('alt-right arrow - fwd to next word', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 17)
  assert.ok(machine.screenCells[16].classList.classes['cursor'])
})

test('meta-left arrow - sol', () => {
  enterKey('ArrowLeft', { metaKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('left arrow at start of line', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 8)
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('alt-left arrow at start of line', () => {
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('meta-left arrow at start of line', () => {
  enterKey('ArrowLeft', { metaKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.ok(machine.screenCells[7].classList.classes['cursor'])
})

test('meta-right arrow - eol', () => {
  enterKey('ArrowRight', { metaKey: true })
  assert.is(input.cursorLocation[0], 21)
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
})

test('alt-right arrow at end of line', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 21)
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
})

test('meta-right arrow at end of line', () => {
  enterKey('ArrowRight', { metaKey: true })
  assert.is(input.cursorLocation[0], 21)
  assert.ok(machine.screenCells[20].classList.classes['cursor'])
})

test('arrow left some and insert', () => {
  repeatKey('ArrowLeft', 4)
  enterKey('X')
  assert.is(input.cursorLocation[0], 18)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX tes')
  assert.is(machine.screenCells[16].innerHTML, 'X')
  assert.ok(machine.screenCells[17].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 22)
})

test('overwrite mode', () => {
  enterKey('i', { ctrlKey: true })
  enterKey('ArrowRight')
  enterKey('M')
  assert.is(input.cursorLocation[0], 20)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX Mes')
  assert.is(machine.screenCells[18].innerHTML, 'M')
  assert.ok(machine.screenCells[19].classList.classes['cursor'])
})

test('overwrite mode at end of string', () => {
  enterString('ess')
  assert.is(input.cursorLocation[0], 23)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX Mess')
  assert.is(machine.screenCells[21].innerHTML, 's')
  assert.is(machine.screenCells[22].innerHTML, '')
  assert.ok(machine.screenCells[22].classList.classes['cursor'])
  assert.ok(input.cursorEnd[0], 23)
  enterKey('i', { ctrlKey: true }) // turn off overwrite mode
})

test('add characters to viewport-scroll one left with empty end slot for cursor', () => {
  repeatKey('A', 16)
  enterKey('X')
  enterKey('Y')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessAAAAAAAAAAAAAAAAXY')
  assert.is(machine.screenCells[7].innerHTML, 'e')
  assert.is(machine.screenCells[38].innerHTML, 'Y')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 1)
})

test('add another character', () => {
  enterKey('B')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessAAAAAAAAAAAAAAAAXYB')
  assert.is(machine.screenCells[7].innerHTML, 'r')
  assert.is(machine.screenCells[38].innerHTML, 'B')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 1)
})

test('backspace to viewport-scroll one right', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessAAAAAAAAAAAAAAAAXY')
  assert.is(machine.screenCells[7].innerHTML, 'e')
  assert.is(machine.screenCells[38].innerHTML, 'Y')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 1)
})

test('backspace again', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessAAAAAAAAAAAAAAAAX')
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(machine.screenCells[38].innerHTML, 'X')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 1)
})

test('shift viewport forward and arrow left to start of viewport', () => {
  repeatKey('G', 6)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 's')
  repeatKey('ArrowLeft', 32)
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 's')
  assert.is(input.cursorInputIndex, 6)
  assert.is(input.singleLineStartIndex, 6)
})

test('arrow left to move viewport', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'i')
  assert.is(input.cursorInputIndex, 5)
  assert.is(input.singleLineStartIndex, 5)
})

test('arrow left to start of content', () =>
{
  repeatKey('ArrowLeft', 5)
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(input.cursorInputIndex, 0)
  assert.is(input.singleLineStartIndex, 0)
})

test('arrow left at start of content', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.cursorInputIndex, 0)
  assert.is(input.singleLineStartIndex, 0)
})

test('arrow right to move to end of viewport', () => {
  repeatKey('ArrowRight', 32)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(input.cursorInputIndex, 32)
  assert.is(input.singleLineStartIndex, 0)
})

test('arrow right to move viewport', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'e')
  assert.is(input.cursorInputIndex, 33)
  assert.is(input.singleLineStartIndex, 1)
})

test('arrow right to end of content', () => {
  repeatKey('ArrowRight', 4)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'i')
  assert.is(input.cursorInputIndex, 37)
  assert.is(input.singleLineStartIndex, 5)
})

test('arrow right to move to extra space at end of content', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 's')
  assert.is(input.cursorInputIndex, 38)
  assert.is(input.singleLineStartIndex, 6)
})

test('arrow right at end of content', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[38].innerHTML, 'G')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.is(input.cursorInputIndex, 38)
  assert.is(input.singleLineStartIndex, 6)
})

test('alt-left arrow to move viewport', () => {
  enterKey('ArrowLeft', { altKey: true })
  enterKey('ArrowLeft', { altKey: true })
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'i')
  assert.is(input.cursorInputIndex, 5)
  assert.is(input.singleLineStartIndex, 5)
})

test('alt-left arrow to start of content', () => {
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(input.cursorInputIndex, 0)
  assert.is(input.singleLineStartIndex, 0)
})

test('alt-right arrow to move viewport and end of content', () => {
  enterKey('ArrowRight', { altKey: true })
  enterKey('ArrowRight', { altKey: true })
  enterKey('ArrowRight', { altKey: true })
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 's')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.is(input.cursorInputIndex, 38)
  assert.is(input.singleLineStartIndex, 6)
})

test('meta-left arrow to sol', () => {
  enterKey('ArrowLeft', { metaKey: true })
  assert.is(input.cursorLocation[0], 8)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 'H')
  assert.is(input.cursorInputIndex, 0)
  assert.is(input.singleLineStartIndex, 0)
})

test('meta-right arrow to eol', () => {
  enterKey('ArrowRight', { metaKey: true })
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[7].innerHTML, 's')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.is(input.cursorInputIndex, 38)
  assert.is(input.singleLineStartIndex, 6)
})

test('ctrl-i and overwrite characters past end of viewport', () => {
  repeatKey('ArrowLeft', 3)
  enterKey('i', { ctrlKey: true })
  enterKey(' ')
  repeatKey('Q', 8)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessAAAAAAAAAAAAAAAAXGGG QQQQQQQQ')
  assert.is(machine.screenCells[7].innerHTML, 'e')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.is(input.cursorInputIndex, 44)
  assert.is(input.singleLineStartIndex, 12)
  enterKey('i', { ctrlKey: true })
})

test('write until warn cursor', () => {
  enterKey(' ')
  repeatKey('Y', 105)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['warn'])
})

test('write until full but one', () => {
  enterKey(' ')
  repeatKey('U', 8)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['warn'])
})

test('write last char -- overwrite cursor', () => {
  enterKey('F')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, 'F')
  assert.ok(machine.screenCells[39].classList.classes['overwrite'])
})

test('overwrite last char', () => {
  enterKey('P')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, 'P')
  assert.ok(machine.screenCells[39].classList.classes['overwrite'])
})

test('backspace from full buffer', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['warn'])
})

test('backspace from warn cursor', () => {
  repeatKey('Backspace', 10)
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.not(machine.screenCells[39].classList.classes['warn'])
})

test('insert into warning cursor', () => {
  repeatKey('ArrowLeft', 15)
  assert.is(input.cursorLocation[0], 25)
  assert.is(input.cursorLocation[1], 1)
  enterKey(' ')
  assert.is(input.cursorLocation[0], 26)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[24].innerHTML, ' ')
  assert.ok(machine.screenCells[25].classList.classes['warn'])
})

test('insert into overwrite cursor', () => {
  repeatKey('b', 10)
  assert.is(input.cursorLocation[0], 36)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[34].innerHTML, 'b')
  assert.ok(machine.screenCells[35].classList.classes['overwrite'])
})

test('check the buffer after all that', () => {
  assert.is(input.inputText,
    'Here is aX MessAAAAAAAAAAAAAAAAXGGG QQQQQQQQ YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY bbbbbbbbbbYYYYYYYYYYYYYYY'
  )
})

test('newline in input at bottom of screen', () => {
  machine.screen.moveTo([ 1, 10 ])
  let testInput = new FixedInput(machine.currentScreen, { singleLine: true })
  enterString('HELLO', testInput)
  enterKey('Enter', {}, testInput)

  assert.is(testInput.cursorLocation[0], 6)
  assert.is(testInput.cursorLocation[1], 10)
  assert.is(machine.screenCells[360].innerHTML, 'H')
  assert.is(machine.screenCells[364].innerHTML, 'O')
})

test('backspace in overflowed buffer - bug', () => {
  machine.screen.clearViewport()
  machine.screen.moveTo([ 1, 10 ])
  let testInput = new FixedInput(machine.currentScreen, { singleLine: true })
  const testStr = testString(44)
  enterString(testStr, testInput)
  enterKey('Backspace', {}, testInput)
  assert.is(testInput.cursorLocation[0], 40)
  assert.is(testInput.cursorLocation[1], 10)
  assert.is(testInput.inputText, testStr.substring(0, 43))
})

test('text overflow width at bottom of screen', () => {
  machine.screen.clearViewport()
  machine.screen.moveTo([ 1, 10 ])
  let testInput = new FixedInput(machine.currentScreen, { singleLine: true })
  repeatKey('A', 39, testInput)
  enterKey('B', {}, testInput)

  assert.is(testInput.cursorLocation[0], 40)
  assert.is(testInput.cursorLocation[1], 10)
  assert.is(machine.screenCells[360].innerHTML, 'A')
  assert.is(machine.screenCells[398].innerHTML, 'B')
})

test('arrow left/right at end of buffer when windowed', () => {
  machine.screen.moveTo([ 1, 6 ])
  const inputText = testString(45)
  let testInput = new FixedInput(machine.currentScreen, { singleLine: true })
  enterString(inputText, testInput)
  enterKey('ArrowLeft', {}, testInput)
  enterKey('ArrowRight', {}, testInput)
  compareTestString(inputText.substring(6), machine.screenCells, 200, 40)
})

test('arrow left at start of screen at bottom of screen', () => {
  machine.screen.moveTo([ 1, 10 ])
  const inputText = testString(45)
  let testInput = new FixedInput(machine.currentScreen, { singleLine: true })
  enterString(inputText, testInput)
  repeatKey('ArrowLeft', 39, testInput)
  enterKey('ArrowLeft', {}, testInput)
  compareTestString(inputText.substring(5, 45), machine.screenCells, 360, 40)
})

test('prefill', () => {
  machine.screen.moveTo([ 1, 6 ])
  machine.screen.displayString('Input? ', false)
  let prefillInput = new FixedInput(machine.currentScreen, { prefill: 'Hello World', singleLine: true })
  assert.is(prefillInput.inputText, 'Hello World')
  assert.is(machine.screenCells[207].innerHTML, 'H')
  assert.ok(machine.screenCells[207].classList.classes['cursor'])
  assert.is(machine.screenCells[213].innerHTML, 'W')
  assert.is(prefillInput.cursorLocation[0], 8)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 19)
  assert.is(prefillInput.cursorEnd[1], 6)
})

test('prefill with overflow', () => {
  machine.screen.moveTo([ 1, 6 ])
  machine.screen.displayString('Input? ', false)
  let prefillInput = new FixedInput(machine.currentScreen, {
    prefill: 'Hello World This Is a Very Long String That Will Overflow The Buffer', singleLine: true
  })
  assert.is(prefillInput.inputText, 'Hello World This Is a Very Long String That Will Overflow The Buffer')
  assert.is(machine.screenCells[207].innerHTML, 'H')
  assert.ok(machine.screenCells[207].classList.classes['cursor'])
  assert.is(machine.screenCells[213].innerHTML, 'W')
  assert.is(machine.screenCells[239].innerHTML, 'S')
  assert.is(machine.screenCells[240].innerHTML, '')
  assert.is(prefillInput.cursorLocation[0], 8)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 40)
  assert.is(prefillInput.cursorEnd[1], 6)
})

test('move input to new line because too short', () => {
  machine.screen.clearViewport()
  machine.screen.displayString('Here is a really long prompt see?', false)
  let shiftInput = new FixedInput(machine.currentScreen, { singleLine: true })
  assert.is(shiftInput.cursorLocation[0], 1)
  assert.is(shiftInput.cursorLocation[1], 2)
  assert.is(shiftInput.singleLineViewLength, 40)
})

test('move input to new line with scroll up because too short', () => {
  machine.screen.moveTo([1, 10])
  machine.screen.displayString('Here is a really long prompt see?', false)
  let shiftInput = new FixedInput(machine.currentScreen, { singleLine: true })
  assert.is(shiftInput.cursorLocation[0], 1)
  assert.is(shiftInput.cursorLocation[1], 10)
  assert.is(shiftInput.singleLineViewLength, 40)
  assert.ok(machine.screenCells[360].classList.classes['cursor'])
})

test('deleteEol - whole line', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  let prefill = 'BUNCH OF TEXT'
  let prefillInput = new FixedInput(machine.currentScreen, { singleLine: true, prefill: prefill })
  prefillInput.handleKey({ key: 'd', ctrlKey: true })
  compareTestString('', machine.screenCells, 200, prefill.length)
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.inputText, '')
})

test('deleteEol - whole line overflow', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  let prefill = testString(45)
  let prefillInput = new FixedInput(machine.currentScreen, { singleLine: true, prefill })
  prefillInput.handleKey({ key: 'd', ctrlKey: true })
  compareTestString('', machine.screenCells, 200, 40)
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.inputText, '')
})

test('deleteEol - midstring overflow', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  const prefill = testString(45)
  let prefillInput = new FixedInput(machine.currentScreen, { singleLine: true, prefill })
  for (let i = 0; i < 12; i++) { prefillInput.handleKey({ key: 'ArrowRight' }) }
  prefillInput.handleKey({ key: 'D', ctrlKey: true })
  compareTestString(prefill.substring(0, 12), machine.screenCells, 200, prefill.length)
  assert.is(prefillInput.cursorLocation[0], 13)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.inputText, prefill.substring(0, 12))
})

test('deleteEol - midstring way overflow', () => {
  machine.currentScreen.clearViewport()
  machine.currentScreen.moveTo([ 1, 10 ])
  const prefill = testString(60)
  let prefillInput = new FixedInput(machine.currentScreen, { singleLine: true, prefill })
  repeatKey('ArrowRight', 50, prefillInput)
  enterKey('d', { ctrlKey: true }, prefillInput)
  assert.is(prefillInput.inputText, prefill.substring(0, 50))
  compareTestString(prefill.substring(11, 50), machine.screenCells, 360, 40)
  assert.is(prefillInput.cursorLocation[0], 40)
  assert.is(prefillInput.cursorLocation[1], 10)
  assert.is(prefillInput.singleLineStartIndex, 11)
  // test for a bug -- arrow left and then right and it won't go right!
  enterKey('ArrowLeft', {}, prefillInput)
  assert.is(prefillInput.cursorLocation[0], 39)
  assert.is(prefillInput.cursorLocation[1], 10)
  enterKey('ArrowRight', {}, prefillInput)
  assert.is(prefillInput.cursorLocation[0], 40)
  assert.is(prefillInput.cursorLocation[1], 10)
})

// test('deleteEol - at eol', () => {
//   machine.currentScreen.moveTo([ 1, 6 ])
//   let prefillInput = new FixedInput(machine.currentScreen, { prefill: 'BUNCH OF TEXT' })
//   for (let i = 0; i < 13; i++) { prefillInput.handleKey({ key: 'ArrowRight' }) }
//   prefillInput.handleKey({ key: 'd', ctrlKey: true })
//   assert.is(machine.screenCells[200].innerHTML, 'B')
//   assert.is(machine.screenCells[204].innerHTML, 'H')
//   assert.is(machine.screenCells[208].innerHTML, ' ')
//   assert.is(machine.screenCells[211].innerHTML, 'X')
//   assert.is(machine.screenCells[212].innerHTML, 'T')
//   assert.is(prefillInput.cursorLocation[0], 14)
//   assert.is(prefillInput.cursorLocation[1], 6)
//   assert.is(prefillInput.inputText, 'BUNCH OF TEXT')
// })
//
// test('deleteEol - wrap over line', () => {
//   machine.currentScreen.moveTo([ 1, 6 ])
//   let prefillInput = new FixedInput(machine.currentScreen, { prefill: 'A'.repeat(60) })
//   assert.is(machine.screenCells[200].innerHTML, 'A')
//   assert.is(machine.screenCells[259].innerHTML, 'A')
//   prefillInput.handleKey({ key: 'D', ctrlKey: true })
//   assert.is(machine.screenCells[200].innerHTML, '')
//   assert.is(machine.screenCells[259].innerHTML, '')
//   assert.is(prefillInput.cursorLocation[0], 1)
//   assert.is(prefillInput.cursorLocation[1], 6)
//   assert.is(prefillInput.inputText, '')
// })

// TODO: eventually maybe handle error highlighting

test.run()
