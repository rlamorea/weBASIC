import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Machine from './mockMachine.js'
import FixedInput from '../scripts/machine/screens/fixedInput.js'

let machine = new Machine({addScreen: true})

machine.screen.displayString('Input? ', false)

let input = new FixedInput(machine.currentScreen, { singleLine: true })

function enterKey(char, controls = {}) {
  const evt = { key: char, ...controls }
  input.handleKey(evt)
}

function enterString(str) {
  for (const char of str) { enterKey(char) }
}

function repeatKey(char, count) {
  for (let i = 0; i < count; i++) { enterKey(char) }
}

test('initialized', () => {
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

test('prefill', () => {
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

// TODO: eventually maybe handle error highlighting

test.run()
