import { test } from 'uvu'
import * as assert from 'uvu/assert'

import Machine from './mockMachine.js'
import FixedInput from '../scripts/machine/screens/fixedInput.js'

let machine = new Machine({addScreen: true})

let input = new FixedInput(machine.currentScreen)

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
  assert.is(input.cursorLocation[0], 1)
  assert.is(input.cursorLocation[1], 1)
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('enter one char', () => {
  enterKey('A')
  assert.is(input.cursorLocation[0], 2)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'A')
  assert.is(machine.screenCells[0].innerHTML, 'A')
  assert.ok(machine.screenCells[1].classList.classes['cursor'])
})

test('backspace one char', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 1)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, '')
  assert.is(machine.screenCells[0].innerHTML, '')
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('backspace at start of line', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 1)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, '')
  assert.is(machine.screenCells[0].innerHTML, '')
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('enter string', () => {
  enterString('Here is a test')
  assert.is(input.cursorLocation[0], 15)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a test')
  assert.is(machine.screenCells[0].innerHTML, 'H')
  assert.is(machine.screenCells[13].innerHTML, 't')
  assert.ok(machine.screenCells[14].classList.classes['cursor'])
})

test('backspace pulls cursor end in one', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 14)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a tes')
  assert.is(machine.screenCells[0].innerHTML, 'H')
  assert.is(machine.screenCells[12].innerHTML, 's')
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 14)
})

test( 'left arrow', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 13)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is a tes')
  assert.is(machine.screenCells[0].innerHTML, 'H')
  assert.is(machine.screenCells[12].innerHTML, 's')
  assert.ok(machine.screenCells[12].classList.classes['cursor'])
})

test('right arrow at end with room', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 14)
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
})

test('right arrow at end of line', () => {
  enterKey('ArrowRight')
  assert.is(input.cursorLocation[0], 14)
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
})

test('alt-left arrow - back to start of word', () => {
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 11)
  assert.ok(machine.screenCells[10].classList.classes['cursor'])
})

test('alt-left arrow - back two words', () => {
  enterKey('ArrowLeft', { altKey: true })
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 6)
  assert.ok(machine.screenCells[5].classList.classes['cursor'])
})

test('alt-right arrow - fwd to end of word', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 7)
  assert.ok(machine.screenCells[6].classList.classes['cursor'])
})

test('alt-right arrow - fwd to next word', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 9)
  assert.ok(machine.screenCells[8].classList.classes['cursor'])
})

test('meta-left arrow - sol', () => {
  enterKey('ArrowLeft', { metaKey: true })
  assert.is(input.cursorLocation[0], 1)
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('left arrow at start of line', () => {
  enterKey('ArrowLeft')
  assert.is(input.cursorLocation[0], 1)
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('alt-left arrow at start of line', () => {
  enterKey('ArrowLeft', { altKey: true })
  assert.is(input.cursorLocation[0], 1)
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('meta-left arrow at start of line', () => {
  enterKey('ArrowLeft', { metaKey: true })
  assert.is(input.cursorLocation[0], 1)
  assert.ok(machine.screenCells[0].classList.classes['cursor'])
})

test('meta-right arrow - eol', () => {
  enterKey('ArrowRight', { metaKey: true })
  assert.is(input.cursorLocation[0], 14)
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
})

test('alt-right arrow at end of line', () => {
  enterKey('ArrowRight', { altKey: true })
  assert.is(input.cursorLocation[0], 14)
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
})

test('meta-right arrow at end of line', () => {
  enterKey('ArrowRight', { metaKey: true })
  assert.is(input.cursorLocation[0], 14)
  assert.ok(machine.screenCells[13].classList.classes['cursor'])
})

test('arrow left some and insert', () => {
  repeatKey('ArrowLeft', 4)
  enterKey('X')
  assert.is(input.cursorLocation[0], 11)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX tes')
  assert.is(machine.screenCells[9].innerHTML, 'X')
  assert.ok(machine.screenCells[10].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 15)
})

test('overwrite mode', () => {
  enterKey('i', { ctrlKey: true })
  enterKey('ArrowRight')
  enterKey('M')
  assert.is(input.cursorLocation[0], 13)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX Mes')
  assert.is(machine.screenCells[11].innerHTML, 'M')
  assert.ok(machine.screenCells[12].classList.classes['cursor'])
})

test('overwrite mode at end of string', () => {
  enterString('ess')
  assert.is(input.cursorLocation[0], 16)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX Mess')
  assert.is(machine.screenCells[14].innerHTML, 's')
  assert.is(machine.screenCells[15].innerHTML, '')
  assert.ok(machine.screenCells[15].classList.classes['cursor'])
  assert.ok(input.cursorEnd[0], 16)
})

test('wrap around line', () => {
  enterKey('I', { ctrlKey: true }) // back to insert mode
  repeatKey('O', 25)
  assert.is(input.cursorLocation[0], 1)
  assert.is(input.cursorLocation[1], 2)
  assert.is(input.inputText, 'Here is aX MessOOOOOOOOOOOOOOOOOOOOOOOOO')
  assert.is(machine.screenCells[39].innerHTML, 'O')
  assert.is(machine.screenCells[40].innerHTML, '')
  assert.ok(machine.screenCells[40].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 1)
  assert.is(input.cursorEnd[1], 2)
})

test('backspace wrap', () => {
  enterKey('Backspace')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessOOOOOOOOOOOOOOOOOOOOOOOO')
  assert.is(machine.screenCells[38].innerHTML, 'O')
  assert.is(machine.screenCells[39].innerHTML, '')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 1)
})

test('insert wrap end', () => {
  enterKey('ArrowLeft')
  enterKey('Y')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessOOOOOOOOOOOOOOOOOOOOOOOYO')
  assert.is(machine.screenCells[38].innerHTML, 'Y')
  assert.is(machine.screenCells[39].innerHTML, 'O')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 1)
  assert.is(input.cursorEnd[1], 2)
})

test('insert wrap text', () => {
  enterKey('ArrowLeft')
  enterKey('Y')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 1)
  assert.is(input.inputText, 'Here is aX MessOOOOOOOOOOOOOOOOOOOOOOOYYO')
  assert.is(machine.screenCells[38].innerHTML, 'Y')
  assert.is(machine.screenCells[39].innerHTML, 'Y')
  assert.is(machine.screenCells[40].innerHTML, 'O')
  assert.ok(machine.screenCells[39].classList.classes['cursor'])
  assert.is(input.cursorEnd[0], 2)
  assert.is(input.cursorEnd[1], 2)
})

test('warn cursor', () => {
  enterKey('ArrowRight', { metaKey: true })
  repeatKey('m', 39+40+29)
  assert.is(input.cursorLocation[0], 30)
  assert.is(input.cursorLocation[1], 4)
  assert.is(machine.screenCells[148].innerHTML, 'm')
  assert.ok(machine.screenCells[149].classList.classes['cursor'])
  assert.not(machine.screenCells[149].classList.classes['warn'])
  enterKey('q')
  assert.is(input.cursorLocation[0], 31)
  assert.is(input.cursorLocation[1], 4)
  assert.ok(machine.screenCells[150].classList.classes['cursor'])
  assert.ok(machine.screenCells[150].classList.classes['warn'])
})

test('warn cursor when full but one', () => {
  repeatKey('f', 9)
  assert.is(input.cursorLocation[0], 40)
  assert.is(machine.screenCells[158].innerHTML, 'f')
  assert.is(machine.screenCells[159].innerHTML, '')
  assert.ok(machine.screenCells[159].classList.classes['cursor'])
  assert.ok(machine.screenCells[159].classList.classes['warn'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 4)
})

test('overwrite cursor when full no cursor movement', () => {
  enterKey('F')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 4)
  assert.is(machine.screenCells[159].innerHTML, 'F')
  assert.is(machine.screenCells[160].innerHTML, '')
  assert.ok(machine.screenCells[159].classList.classes['cursor'])
  assert.ok(machine.screenCells[159].classList.classes['overwrite'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 4)
})

test('overwrite when full no cursor movement', () => {
  enterKey('K')
  assert.is(input.cursorLocation[0], 40)
  assert.is(input.cursorLocation[1], 4)
  assert.is(machine.screenCells[159].innerHTML, 'K')
  assert.is(machine.screenCells[160].innerHTML, '')
  assert.ok(machine.screenCells[159].classList.classes['cursor'])
  assert.ok(machine.screenCells[159].classList.classes['overwrite'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 4)
})

test('automatic overwrite when buffer full', () => {
  enterKey('ArrowLeft', { metaKey: true })
  enterKey('5')
  assert.is(input.cursorLocation[0], 2)
  assert.is(input.cursorLocation[1], 1)
  assert.is(machine.screenCells[0].innerHTML, '5')
  assert.is(machine.screenCells[1].innerHTML, 'e')
  assert.ok(machine.screenCells[1].classList.classes['cursor'])
  assert.ok(machine.screenCells[1].classList.classes['overwrite'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 4)
})

test('insert into warning cursor', () => {
  enterKey('ArrowRight', { metaKey: true })
  repeatKey('Backspace', 11)
  assert.is(input.cursorLocation[0], 30)
  assert.is(input.cursorLocation[1], 4)
  assert.is(machine.screenCells[148].innerHTML, 'm')
  assert.ok(machine.screenCells[149].classList.classes['cursor'])
  assert.not(machine.screenCells[149].classList.classes['warn'])
  assert.is(input.cursorEnd[0], 30)
  assert.is(input.cursorEnd[1], 4)
  repeatKey('ArrowLeft', 5)
  enterKey('W')
  assert.is(input.cursorLocation[0], 26)
  assert.is(machine.screenCells[144].innerHTML, 'W')
  assert.ok(machine.screenCells[145].classList.classes['cursor'])
  assert.ok(machine.screenCells[145].classList.classes['warn'])
  assert.is(input.cursorEnd[0], 31)
  assert.is(input.cursorEnd[1], 4)
})

test('insert into overwrite cursor', () => {
  repeatKey('j', 10)
  assert.is(input.cursorLocation[0], 36)
  assert.is(machine.screenCells[154].innerHTML, 'j')
  assert.ok(machine.screenCells[155].classList.classes['cursor'])
  assert.ok(machine.screenCells[155].classList.classes['overwrite'])
  assert.is(input.cursorEnd[0], 40)
  assert.is(input.cursorEnd[1], 4)
})

test('check the buffer after all that', () => {
  const final =
    '5ere is aX MessOOOOOOOOOOOOOOOOOOOOOOOYY' +
    'Ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmWjjjjjjjjjjmmmmm'
  assert.is(input.inputText, final)
})

test('prefill', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  let prefillInput = new FixedInput(machine.currentScreen, { prefill: 'Hello World' })
  assert.is(prefillInput.inputText, 'Hello World')
  assert.is(machine.screenCells[200].innerHTML, 'H')
  assert.ok(machine.screenCells[200].classList.classes['cursor'])
  assert.is(machine.screenCells[206].innerHTML, 'W')
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 12)
  assert.is(prefillInput.cursorEnd[1], 6)
})

test('prefill to max length', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  const final =
    '5ere is aX MessOOOOOOOOOOOOOOOOOOOOOOOYY' +
    'Ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmWjjjjjjjjjjmmmmm'
  let prefillInput = new FixedInput(machine.currentScreen, { prefill: final })
  assert.is(prefillInput.inputText, final)
  assert.is(machine.screenCells[200].innerHTML, '5')
  assert.ok(machine.screenCells[200].classList.classes['cursor'])
  assert.ok(machine.screenCells[200].classList.classes['overwrite'])
  assert.is(machine.screenCells[359].innerHTML, 'm')
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 40)
  assert.is(prefillInput.cursorEnd[1], 9)
})

test('prefill beyond max length', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  const final =
    '5ere is aX MessOOOOOOOOOOOOOOOOOOOOOOOYY' +
    'Ommmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm' +
    'mmmmmmmmmmmmmmmmmmmmmmmmWjjjjjjjjjjmmmmm'
  let prefillInput = new FixedInput(machine.currentScreen, { prefill: final + '77777' })
  assert.is(prefillInput.inputText, final)
  assert.is(machine.screenCells[200].innerHTML, '5')
  assert.ok(machine.screenCells[200].classList.classes['cursor'])
  assert.ok(machine.screenCells[200].classList.classes['overwrite'])
  assert.is(machine.screenCells[359].innerHTML, 'm')
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 40)
  assert.is(prefillInput.cursorEnd[1], 9)
})

test('prefill with error', () => {
  machine.currentScreen.moveTo([ 1, 6 ])
  let prefillInput = new FixedInput(machine.currentScreen, { prefill: 'PRINT 7bar', errorLocation: 6, errorEndLocation: 9 })
  assert.is(prefillInput.inputText, 'PRINT 7bar')
  assert.is(machine.screenCells[200].innerHTML, 'P')
  assert.ok(machine.screenCells[200].classList.classes['cursor'])
  assert.is(machine.screenCells[206].innerHTML, '7')
  assert.not(machine.screenCells[205].classList.classes['error'])
  assert.ok(machine.screenCells[206].classList.classes['error'])
  assert.ok(machine.screenCells[207].classList.classes['error'])
  assert.ok(machine.screenCells[208].classList.classes['error'])
  assert.ok(machine.screenCells[209].classList.classes['error'])
  assert.not(machine.screenCells[210].classList.classes['error'])
  assert.is(prefillInput.cursorLocation[0], 1)
  assert.is(prefillInput.cursorLocation[1], 6)
  assert.is(prefillInput.cursorEnd[0], 11)
  assert.is(prefillInput.cursorEnd[1], 6)
})

test.run()
