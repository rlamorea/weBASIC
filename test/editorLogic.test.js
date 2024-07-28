import { test } from 'uvu';
import * as assert from 'uvu/assert';

import Machine from './mockMachine.js'
import Lexifier from "../scripts/interpreter/lexifier.js"
import { processLineActions } from "../scripts/machine/screens/editorLogic.js"
import { ErrorCodes } from "../scripts/interpreter/errors.js"
import { addProgram } from "./testHelpers.js";

const machine = new Machine()
const lexifier = new Lexifier(machine)

let globalEditorContents = ''

function processTest(codeLine, screenLine, editorContents = null, typed = true) {
  let globalContents = false
  if (!editorContents) {
    editorContents = globalEditorContents
    globalContents = true
  }
  if (typed) {
    editorContents += codeLine // NOTE: no carriage return because we have intercepted it!
  }

  const actions = processLineActions(codeLine, screenLine, machine, editorContents)
  let cursorLine = -1
  let editorLines = editorContents.split('\n').map((x) => x+'\n')
  if (editorLines[editorLines.length - 1] === '\n') { editorLines.pop() }
  for (const action of actions) {
    switch (action.action) {
      case 'clearLine':
        const linesToDelete = ((action.endScreenLine || action.screenLine) - action.screenLine + 1)
        editorLines.splice(action.screenLine - 1, linesToDelete)
        break
      case 'insertLine':
        const valuesToInsert = action.value.split('\n').map((x) => x+'\n')
        if (editorLines.length === 0) { editorLines.push(...valuesToInsert) } else
        { editorLines.splice(action.screenLine - 1, 0, ...valuesToInsert) }
        break
      case 'replaceLine':
        editorLines.splice( action.screenLine - 1, 1, action.value + '\n' )
        break
      case 'setLine':
        cursorLine = action.screenLine
        break
    }
  }
  editorContents = editorLines.join('')
  if (globalContents) { globalEditorContents = editorContents }
  return { actions, editorLines, cursorLine, editorContents }
}

// function sortTest(seditorLines) {
//   const editorContent = seditorLines.join('\n')
//   let actions = []
//
//   const editorLines = editorContent.split('\n')
//   if (editorLines[editorLines.length - 1] === '') { editorLines.pop() }
//
//   let screenLine = 1
//   let allLines = []
//   let lineNumbers = []
//   // pass 1 - get the lines, line numbers, and screen lines
//   for (const line of editorLines) {
//     let lineNumber = parseInt(line.trim().match(/^(\d+)/)[1])
//     let info = { line, lineNumber, screenLine }
//     allLines.push(info)
//     lineNumbers.push(lineNumber)
//     screenLine += 1
//   }
//
//   lineNumbers.sort((a, b) => a - b)
//
//   // pass 2 -- identify out-of-order segment
//   let feditorLines = editorContent.split('\n').map((x) => x+'\n')
//   if (feditorLines[feditorLines.length - 1] === '\n') { feditorLines.pop() }
//   for (const action of actions) {
//     switch (action.action) {
//       case 'clearLine':
//         const linesToDelete = ((action.endScreenLine || action.screenLine) - action.screenLine + 1)
//         feditorLines.splice(action.screenLine - 1, linesToDelete)
//         break
//       case 'insertLine':
//         if (feditorLines.length === 0) { feditorLines.push(action.value + '\n') } else
//         { feditorLines.splice(action.screenLine - 1, 0, action.value + '\n') }
//         break
//       case 'replaceLine':
//         feditorLines.splice( action.screenLine - 1, 1, action.value + '\n' )
//         break
//       case 'setLine':
//         break
//     }
//   }
//   return { editorLines: feditorLines, actions }
// }
//
// test('temp test', () => {
//   const result = sortTest([
//     '3 GOTO 8',
//     '5 GOTO 15',
//     '8 GOTO 10',
//     '15 GOTO 20',
//     '10 PRINT "hello world"',
//     '20 GOTO 10',
//     '30 GOTO 20',
//   ])
//
//   assert.is(result.editorLines.length, 7)
// })

function editLine(screenLine, newLine, editorContents) {
  let globalContents = false
  if (!editorContents) {
    editorContents = globalEditorContents
    globalContents = true
  }
  let editorLines = editorContents.split('\n').map((x) => x+'\n')
  if (editorLines[editorLines.length - 1] === '\n') { editorLines.pop() }
  editorLines.splice(screenLine - 1, 1,newLine + '\n') // the newline was already there!
  if (globalContents) {
    globalEditorContents = editorLines.join('')
  }
  return editorContents
}

test('insert cold line to empty editor', () => {
  const result = processTest('10 print "hello"', -1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '10 PRINT "hello"\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 1)
  assert.is(machine.runCodespace.lineNumbers.length , 1)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 1)
})

test('insert last line as last line', () => {
  const result = processTest('20 goto 10', 2)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '10 PRINT "hello"\n')
  assert.is(result.editorLines[1], '20 GOTO 10\n')
  assert.is(result.cursorLine, 3)
  assert.is(result.editorLines.length, 2)
  assert.is(machine.runCodespace.lineNumbers.length , 2)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 2)
})

test('insert middle line as last line', () => {
  const result = processTest('15 print "mid"', 3)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '10 PRINT "hello"\n')
  assert.is(result.editorLines[1], '15 PRINT "mid"\n')
  assert.is(result.editorLines[2], '20 GOTO 10\n')
  assert.is(result.cursorLine, 3)
  assert.is(result.editorLines.length, 3)
  assert.is(machine.runCodespace.lineNumbers.length , 3)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 3)
})

test('edit first line', () => {
  editLine(1, '10 PRINT "Hello"')
  const result = processTest('10 PRINT "Hello"', 1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[1], '15 PRINT "mid"\n')
  assert.is(result.editorLines[2], '20 GOTO 10\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 3)
  assert.is(machine.runCodespace.lineNumbers.length , 3)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 3)
})

test('third line renumbered to before third line', () => {
  editLine(3, '17 GOTO 10')
  const result = processTest('17 GOTO 10', 3, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[1], '15 PRINT "mid"\n')
  assert.is(result.editorLines[2], '17 GOTO 10\n')
  assert.is(result.editorLines[3], '20 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 4)
  assert.is(machine.runCodespace.lineNumbers.length , 4)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 4)
})

test('third line renumbered to after third line', () => {
  editLine(3, '19 goto 10')
  const result = processTest('19 goto 10', 3, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[1], '15 PRINT "mid"\n')
  assert.is(result.editorLines[2], '17 GOTO 10\n')
  assert.is(result.editorLines[3], '19 GOTO 10\n')
  assert.is(result.editorLines[4], '20 GOTO 10\n')
  assert.is(result.cursorLine, 5)
  assert.is(result.editorLines.length, 5)
  assert.is(machine.runCodespace.lineNumbers.length , 5)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 5)
})

test('insert first line above first line', () => {
  globalEditorContents = '5 print "top"\n' + globalEditorContents
  const result = processTest('5 print "top"', 1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[2], '15 PRINT "mid"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '19 GOTO 10\n')
  assert.is(result.editorLines[5], '20 GOTO 10\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('insert first line by renumbering first line', () => {
  editLine(1, '3 print "top"')
  const result = processTest('3 PRINT "top"', 1, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[3], '15 PRINT "mid"\n')
  assert.is(result.editorLines[4], '17 GOTO 10\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.editorLines[6], '20 GOTO 10\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 7)
  assert.is(machine.runCodespace.lineNumbers.length , 7)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 7)
})

test('insert middle line by renumbering first line', () => {
  editLine(1, '12 print "top"')
  const result = processTest('12 PRINT "top"', 1, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[3], '12 PRINT "top"\n')
  assert.is(result.editorLines[4], '15 PRINT "mid"\n')
  assert.is(result.editorLines[5], '17 GOTO 10\n')
  assert.is(result.editorLines[6], '19 GOTO 10\n')
  assert.is(result.editorLines[7], '20 GOTO 10\n')
  assert.is(result.cursorLine, 5)
  assert.is(result.editorLines.length, 8)
  assert.is(machine.runCodespace.lineNumbers.length , 8)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 8)
})

test('insert last line from above first line', () => {
  globalEditorContents = '25 print "bottom"\n' + globalEditorContents
  const result = processTest('25 print "bottom"', 1, null, false)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[3], '12 PRINT "top"\n')
  assert.is(result.editorLines[4], '15 PRINT "mid"\n')
  assert.is(result.editorLines[5], '17 GOTO 10\n')
  assert.is(result.editorLines[6], '19 GOTO 10\n')
  assert.is(result.editorLines[7], '20 GOTO 10\n')
  assert.is(result.editorLines[8], '25 PRINT "bottom"\n')
  assert.is(result.cursorLine, 10)
  assert.is(result.editorLines.length, 9)
  assert.is(machine.runCodespace.lineNumbers.length , 9)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 9)
})

test('insert last line by renumbering first line', () => {
  editLine(1, '28 print "top"')
  const result = processTest('28 PRINT "top"', 1, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[3], '12 PRINT "top"\n')
  assert.is(result.editorLines[4], '15 PRINT "mid"\n')
  assert.is(result.editorLines[5], '17 GOTO 10\n')
  assert.is(result.editorLines[6], '19 GOTO 10\n')
  assert.is(result.editorLines[7], '20 GOTO 10\n')
  assert.is(result.editorLines[8], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[9], '28 PRINT "top"\n')
  assert.is(result.cursorLine, 11)
  assert.is(result.editorLines.length, 10)
  assert.is(machine.runCodespace.lineNumbers.length , 10)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 10)
})

test('insert middle line in place', () => {
  const insIdx = 60
  globalEditorContents = globalEditorContents.substring(0, insIdx) + '13 print "midins"\n' + globalEditorContents.substring(insIdx)
  const result = processTest('13 print "midins"', 5, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[3], '12 PRINT "top"\n')
  assert.is(result.editorLines[4], '13 PRINT "midins"\n')
  assert.is(result.editorLines[5], '15 PRINT "mid"\n')
  assert.is(result.editorLines[6], '17 GOTO 10\n')
  assert.is(result.editorLines[7], '19 GOTO 10\n')
  assert.is(result.editorLines[8], '20 GOTO 10\n')
  assert.is(result.editorLines[9], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[10], '28 PRINT "top"\n')
  assert.is(result.cursorLine, 6)
  assert.is(result.editorLines.length, 11)
  assert.is(machine.runCodespace.lineNumbers.length , 11)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 11)
})

test('insert first line by renumbering middle line', () => {
  editLine(5, '2 PRINT "midins"')
  const result = processTest('2 print "midins"', 5, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '2 PRINT "midins"\n')
  assert.is(result.editorLines[1], '3 PRINT "top"\n')
  assert.is(result.editorLines[2], '5 PRINT "top"\n')
  assert.is(result.editorLines[3], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[4], '12 PRINT "top"\n')
  assert.is(result.editorLines[5], '13 PRINT "midins"\n')
  assert.is(result.editorLines[6], '15 PRINT "mid"\n')
  assert.is(result.editorLines[7], '17 GOTO 10\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.editorLines[9], '20 GOTO 10\n')
  assert.is(result.editorLines[10], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[11], '28 PRINT "top"\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 12)
  assert.is(machine.runCodespace.lineNumbers.length , 12)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 12)
})

test('insert last line by renumbering middle line', () => {
  editLine(6, '30 PRINT "midins"')
  const result = processTest('30 print "midins"', 6, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '2 PRINT "midins"\n')
  assert.is(result.editorLines[1], '3 PRINT "top"\n')
  assert.is(result.editorLines[2], '5 PRINT "top"\n')
  assert.is(result.editorLines[3], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[4], '12 PRINT "top"\n')
  assert.is(result.editorLines[5], '13 PRINT "midins"\n')
  assert.is(result.editorLines[6], '15 PRINT "mid"\n')
  assert.is(result.editorLines[7], '17 GOTO 10\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.editorLines[9], '20 GOTO 10\n')
  assert.is(result.editorLines[10], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[11], '28 PRINT "top"\n')
  assert.is(result.editorLines[12], '30 PRINT "midins"\n')
  assert.is(result.cursorLine, 14)
  assert.is(result.editorLines.length, 13)
  assert.is(machine.runCodespace.lineNumbers.length , 13)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 13)
})

test('edit middle line in place', () => {
  editLine(7, '15 PRINT "midedit"')
  const result = processTest('15 PRINT "midedit"', 7, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '2 PRINT "midins"\n')
  assert.is(result.editorLines[1], '3 PRINT "top"\n')
  assert.is(result.editorLines[2], '5 PRINT "top"\n')
  assert.is(result.editorLines[3], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[4], '12 PRINT "top"\n')
  assert.is(result.editorLines[5], '13 PRINT "midins"\n')
  assert.is(result.editorLines[6], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[7], '17 GOTO 10\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.editorLines[9], '20 GOTO 10\n')
  assert.is(result.editorLines[10], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[11], '28 PRINT "top"\n')
  assert.is(result.editorLines[12], '30 PRINT "midins"\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 13)
  assert.is(machine.runCodespace.lineNumbers.length , 13)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 13)
})

test('edit last line in place', () => {
  editLine(13, '30 PRINT "endit"')
  const result = processTest('30 PRINT "endit"', 13, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '2 PRINT "midins"\n')
  assert.is(result.editorLines[1], '3 PRINT "top"\n')
  assert.is(result.editorLines[2], '5 PRINT "top"\n')
  assert.is(result.editorLines[3], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[4], '12 PRINT "top"\n')
  assert.is(result.editorLines[5], '13 PRINT "midins"\n')
  assert.is(result.editorLines[6], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[7], '17 GOTO 10\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.editorLines[9], '20 GOTO 10\n')
  assert.is(result.editorLines[10], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[11], '28 PRINT "top"\n')
  assert.is(result.editorLines[12], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 14)
  assert.is(result.editorLines.length, 13)
  assert.is(machine.runCodespace.lineNumbers.length , 13)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 13)
})

test('insert first line from last screen line', () => {
  const result = processTest('1 PRINT "toptop"', 14)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[1], '2 PRINT "midins"\n')
  assert.is(result.editorLines[2], '3 PRINT "top"\n')
  assert.is(result.editorLines[3], '5 PRINT "top"\n')
  assert.is(result.editorLines[4], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[5], '12 PRINT "top"\n')
  assert.is(result.editorLines[6], '13 PRINT "midins"\n')
  assert.is(result.editorLines[7], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[8], '17 GOTO 10\n')
  assert.is(result.editorLines[9], '19 GOTO 10\n')
  assert.is(result.editorLines[10], '20 GOTO 10\n')
  assert.is(result.editorLines[11], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[12], '28 PRINT "top"\n')
  assert.is(result.editorLines[13], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 14)
  assert.is(machine.runCodespace.lineNumbers.length , 14)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 14)
})

test('insert first line 0 by renumbering last screen line', () => {
  editLine(14, '0 PRINT "tiptop"')
  const result = processTest('0 PRINT "tiptop"', 14, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '12 PRINT "top"\n')
  assert.is(result.editorLines[7], '13 PRINT "midins"\n')
  assert.is(result.editorLines[8], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[9], '17 GOTO 10\n')
  assert.is(result.editorLines[10], '19 GOTO 10\n')
  assert.is(result.editorLines[11], '20 GOTO 10\n')
  assert.is(result.editorLines[12], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[13], '28 PRINT "top"\n')
  assert.is(result.editorLines[14], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 15)
  assert.is(machine.runCodespace.lineNumbers.length , 15)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 15)
})

test('insert middle line by renumbering last screen line', () => {
  editLine(15, '16 Print "midlast"')
  const result = processTest('16 Print "midlast"', 15, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '12 PRINT "top"\n')
  assert.is(result.editorLines[7], '13 PRINT "midins"\n')
  assert.is(result.editorLines[8], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[9], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[10], '17 GOTO 10\n')
  assert.is(result.editorLines[11], '19 GOTO 10\n')
  assert.is(result.editorLines[12], '20 GOTO 10\n')
  assert.is(result.editorLines[13], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[14], '28 PRINT "top"\n')
  assert.is(result.editorLines[15], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 11)
  assert.is(result.editorLines.length, 16)
  assert.is(machine.runCodespace.lineNumbers.length , 16)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 16)
})

test('cut three middle lines and add a line above', () => {
  const cutIdxIn = 96
  const cutIdxOut = 148
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '14 print "midcut"\n' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('14 print "midcut"', 7, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '12 PRINT "top"\n')
  assert.is(result.editorLines[7], '13 PRINT "midins"\n')
  assert.is(result.editorLines[8], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[9], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[10], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[11], '17 GOTO 10\n')
  assert.is(result.editorLines[12], '19 GOTO 10\n')
  assert.is(result.editorLines[13], '20 GOTO 10\n')
  assert.is(result.editorLines[14], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[15], '28 PRINT "top"\n')
  assert.is(result.editorLines[16], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 10)
  assert.is(result.editorLines.length, 17)
  assert.is(machine.runCodespace.lineNumbers.length , 17)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 17)
})

test('cut three top lines and add a line below', () => {
  const cutIdxOut = 51
  globalEditorContents = '11 print "topcut"\n' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('11 print "topcut"', 1, null, false)

  assert.is(result.actions.length, 7)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '19 GOTO 10\n')
  assert.is(result.editorLines[14], '20 GOTO 10\n')
  assert.is(result.editorLines[15], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[16], '28 PRINT "top"\n')
  assert.is(result.editorLines[17], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 18)
  assert.is(machine.runCodespace.lineNumbers.length , 18)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 18)
})

test('cut three bottom lines and add a line in the middle', () => {
  const cutIdxIn = 236
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '18 print "bottomcut"'
  const result = processTest('18 print "bottomcut"', 16, null, false)

  assert.is(result.actions.length, 7)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[14], '19 GOTO 10\n')
  assert.is(result.editorLines[15], '20 GOTO 10\n')
  assert.is(result.editorLines[16], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[17], '28 PRINT "top"\n')
  assert.is(result.editorLines[18], '30 PRINT "endit"\n')
  assert.is(result.cursorLine, 15)
  assert.is(result.editorLines.length, 19)
  assert.is(machine.runCodespace.lineNumbers.length , 19)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 19)
})

test('delete last line from last screen line', () => {
  const result = processTest('30', 20)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[14], '19 GOTO 10\n')
  assert.is(result.editorLines[15], '20 GOTO 10\n')
  assert.is(result.editorLines[16], '25 PRINT "bottom"\n')
  assert.is(result.editorLines[17], '28 PRINT "top"\n')
  assert.is(result.cursorLine, 19)
  assert.is(result.editorLines.length, 18)
  assert.is(machine.runCodespace.lineNumbers.length , 18)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 18)
})

test('delete last line in place', () => {
  editLine(18, '28')
  const result = processTest('28', 18, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[14], '19 GOTO 10\n')
  assert.is(result.editorLines[15], '20 GOTO 10\n')
  assert.is(result.editorLines[16], '25 PRINT "bottom"\n')
  assert.is(result.cursorLine, 18)
  assert.is(result.editorLines.length, 17)
  assert.is(machine.runCodespace.lineNumbers.length , 17)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 17)
})

test('delete last line from middle', () => {
  const cutIdxIn = 96
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '25\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('25', 7, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[14], '19 GOTO 10\n')
  assert.is(result.editorLines[15], '20 GOTO 10\n')
  assert.is(result.cursorLine, 17)
  assert.is(result.editorLines.length, 16)
  assert.is(machine.runCodespace.lineNumbers.length , 16)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 16)
})

test('delete last line by replacing middle line', () => {
  const cutIdxIn = 96
  const cutIdxOut = 114
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '20\n' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('20', 7, null, false)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '12 PRINT "top"\n')
  assert.is(result.editorLines[8], '13 PRINT "midins"\n')
  assert.is(result.editorLines[9], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[10], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[11], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[12], '17 GOTO 10\n')
  assert.is(result.editorLines[13], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[14], '19 GOTO 10\n')
  assert.is(result.cursorLine, 16)
  assert.is(result.editorLines.length, 15)
  assert.is(machine.runCodespace.lineNumbers.length , 15)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 15)
})

test('delete middle line from last screen line', () => {
  const result = processTest('12', 16)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '13 PRINT "midins"\n')
  assert.is(result.editorLines[8], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[9], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[10], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[11], '17 GOTO 10\n')
  assert.is(result.editorLines[12], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[13], '19 GOTO 10\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 14)
  assert.is(machine.runCodespace.lineNumbers.length , 14)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 14)
})

test('delete middle line from middle', () => {
  const cutIdxIn = 79
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '13\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('13', 6, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '10 PRINT "Hello"\n')
  assert.is(result.editorLines[6], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[7], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[8], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[9], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[10], '17 GOTO 10\n')
  assert.is(result.editorLines[11], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[12], '19 GOTO 10\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 13)
  assert.is(machine.runCodespace.lineNumbers.length , 13)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 13)
})

test('delete middle line in place', () => {
  const cutIdxIn = 81
  const cutIdxOut = cutIdxIn + 14
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + globalEditorContents.substring(cutIdxOut)
  const result = processTest('10', 6, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[6], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[7], '15 PRINT "midedit"\n')
  assert.is(result.editorLines[8], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[9], '17 GOTO 10\n')
  assert.is(result.editorLines[10], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[11], '19 GOTO 10\n')
  assert.is(result.cursorLine, 6)
  assert.is(result.editorLines.length, 12)
  assert.is(machine.runCodespace.lineNumbers.length , 12)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 12)
})

test('delete middle line by replacing different middle line', () => {
  const cutIdxIn = 80
  const cutIdxOut = cutIdxIn + 16
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '5' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('15', 6, null, false)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '0 PRINT "tiptop"\n')
  assert.is(result.editorLines[1], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[2], '2 PRINT "midins"\n')
  assert.is(result.editorLines[3], '3 PRINT "top"\n')
  assert.is(result.editorLines[4], '5 PRINT "top"\n')
  assert.is(result.editorLines[5], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[6], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[7], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[8], '17 GOTO 10\n')
  assert.is(result.editorLines[9], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[10], '19 GOTO 10\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 11)
  assert.is(machine.runCodespace.lineNumbers.length , 11)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 11)
})

test('delete first line from last screen line', () => {
  const result = processTest('0', 12)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '1 PRINT "toptop"\n')
  assert.is(result.editorLines[1], '2 PRINT "midins"\n')
  assert.is(result.editorLines[2], '3 PRINT "top"\n')
  assert.is(result.editorLines[3], '5 PRINT "top"\n')
  assert.is(result.editorLines[4], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[5], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[6], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[7], '17 GOTO 10\n')
  assert.is(result.editorLines[8], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[9], '19 GOTO 10\n')
  assert.is(result.cursorLine, 1)
  assert.is(result.editorLines.length, 10)
  assert.is(machine.runCodespace.lineNumbers.length , 10)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 10)
})

test('delete first line from middle', () => {
  const cutIdxIn = 62
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '1\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('1', 5, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '2 PRINT "midins"\n')
  assert.is(result.editorLines[1], '3 PRINT "top"\n')
  assert.is(result.editorLines[2], '5 PRINT "top"\n')
  assert.is(result.editorLines[3], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[4], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[5], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[6], '17 GOTO 10\n')
  assert.is(result.editorLines[7], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.cursorLine, 1)
  assert.is(result.editorLines.length, 9)
  assert.is(machine.runCodespace.lineNumbers.length , 9)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 9)
})

test('delete first line in place', () => {
  const cutIdxOut = 17
  globalEditorContents = '2\n' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('2', 1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '3 PRINT "top"\n')
  assert.is(result.editorLines[1], '5 PRINT "top"\n')
  assert.is(result.editorLines[2], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[3], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[4], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[5], '17 GOTO 10\n')
  assert.is(result.editorLines[6], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[7], '19 GOTO 10\n')
  assert.is(result.cursorLine, 1)
  assert.is(result.editorLines.length, 8)
  assert.is(machine.runCodespace.lineNumbers.length , 8)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 8)
})

test('delete first line above first line', () => {
  globalEditorContents = '3\n' + globalEditorContents
  const result = processTest('3', 1, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '16 PRINT "midlast"\n')
  assert.is(result.editorLines[4], '17 GOTO 10\n')
  assert.is(result.editorLines[5], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[6], '19 GOTO 10\n')
  assert.is(result.cursorLine, 1)
  assert.is(result.editorLines.length, 7)
  assert.is(machine.runCodespace.lineNumbers.length , 7)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 7)
})

test('delete by blank line one above line to delete', () => {
  const cutIdxIn = 50
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '16\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('16', 4, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line from bottom', () => {
  const result = processTest('15', 7)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line from middle', () => {
  const cutIdxIn = 50
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '15\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('15', 4, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line from top', () => {
  globalEditorContents = '15\n' + globalEditorContents
  const result = processTest('15', 1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line replacing last line', () => {
  const cutIdxIn = 82
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '15\n'
  const result = processTest('15', 6, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line replacing middle line', () => {
  const cutIdxIn = 51
  const cutIdxOut = cutIdxIn + 9
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '5' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('15', 4, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('delete non-line replacing top line', () => {
  const cutIdxOut = 14
  globalEditorContents = '15\n' + globalEditorContents.substring(cutIdxOut)
  const result = processTest('15', 1, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.cursorLine, 4)
  assert.is(result.editorLines.length, 6)
  assert.is(machine.runCodespace.lineNumbers.length , 6)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 6)
})

test('syntax error line added last', () => {
  const result = processTest('20 syntax error', 7)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 10\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.editorLines[6], '20 syntax error\n')
  assert.is(result.cursorLine, 8)
  assert.is(result.editorLines.length, 7)
  assert.is(machine.runCodespace.lineNumbers.length , 7)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 7)
  assert.is(machine.runCodespace.codeLines[20].error.error, ErrorCodes.SYNTAX)
})

test('insert existing line from outside editor', () => {
  const result = processTest('17 GOTO 14', -1, null, false)

  assert.is(result.actions.length, 2)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 14\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.editorLines[6], '20 syntax error\n')
  assert.is(result.cursorLine, 5)
  assert.is(result.editorLines.length, 7)
  assert.is(machine.runCodespace.lineNumbers.length , 7)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 7)
})

test('paste case cut middle lines and paste them back', () => {
  const cutIdxIn = 31
  const cutIdxOut = 60
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + globalEditorContents.substring(cutIdxOut)
  const result= processTest('17 GOTO 14', -1, null, false)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '17 GOTO 14\n')
  assert.is(result.editorLines[4], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[5], '19 GOTO 10\n')
  assert.is(result.editorLines[6], '20 syntax error\n')
  assert.is(result.cursorLine, 5)
  assert.is(result.editorLines.length, 7)
  assert.is(machine.runCodespace.lineNumbers.length , 7)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 7)
})

test('add a line in a big gap where it belongs, keep the gap', () => {
  const cutIdxIn = 50
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '15 PRINT "newline"\n\n\n\n\n' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('15 PRINT "newline"', 4, null, false)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '15 PRINT "newline"\n')
  assert.is(result.editorLines[4], '\n')
  assert.is(result.editorLines[5], '\n')
  assert.is(result.editorLines[6], '\n')
  assert.is(result.editorLines[7], '\n')
  assert.is(result.editorLines[8], '17 GOTO 14\n')
  assert.is(result.editorLines[9], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[10], '19 GOTO 10\n')
  assert.is(result.editorLines[11], '20 syntax error\n')
  assert.is(result.cursorLine, 5)
  assert.is(result.editorLines.length, 12)
  assert.is(machine.runCodespace.lineNumbers.length , 8)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 8)
})

test('add an existing line in a big gap where it belongs with blank above, keep the gap', () => {
  const cutIdxIn = 70
  globalEditorContents = globalEditorContents.substring(0, cutIdxIn) + '16 PRINT "newnew"' + globalEditorContents.substring(cutIdxIn)
  const result = processTest('16 PRINT "newnew"', 6, null, false)

  assert.is(result.actions.length, 5)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '15 PRINT "newline"\n')
  assert.is(result.editorLines[4], '16 PRINT "newnew"\n')
  assert.is(result.editorLines[5], '\n')
  assert.is(result.editorLines[6], '\n')
  assert.is(result.editorLines[7], '17 GOTO 14\n')
  assert.is(result.editorLines[8], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[9], '19 GOTO 10\n')
  assert.is(result.editorLines[10], '20 syntax error\n')
  assert.is(result.cursorLine, 6)
  assert.is(result.editorLines.length, 11)
  assert.is(machine.runCodespace.lineNumbers.length , 9)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 9)
})

test('add an exec line', () => {
  const result = processTest('print "exec"', 12)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '15 PRINT "newline"\n')
  assert.is(result.editorLines[4], '16 PRINT "newnew"\n')
  assert.is(result.editorLines[5], '17 GOTO 14\n')
  assert.is(result.editorLines[6], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[7], '19 GOTO 10\n')
  assert.is(result.editorLines[8], '20 syntax error\n')
  assert.is(result.editorLines[9], 'PRINT "exec"\n')
  assert.is(result.cursorLine, 11)
  assert.is(result.editorLines.length, 10)
  assert.is(machine.runCodespace.lineNumbers.length , 9)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 9)
})

test('insert an exec line', () => {
  const result = processTest('print "exec2"', -1, null, false)

  assert.is(result.actions.length, 4)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[3], '15 PRINT "newline"\n')
  assert.is(result.editorLines[4], '16 PRINT "newnew"\n')
  assert.is(result.editorLines[5], '17 GOTO 14\n')
  assert.is(result.editorLines[6], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[7], '19 GOTO 10\n')
  assert.is(result.editorLines[8], '20 syntax error\n')
  assert.is(result.editorLines[9], 'PRINT "exec"\n')
  assert.is(result.editorLines[10], 'PRINT "exec2"\n')
  assert.is(result.cursorLine, 12)
  assert.is(result.editorLines.length, 11)
  assert.is(machine.runCodespace.lineNumbers.length , 9)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 9)
})

test('paste test - insert an exec line and another line', () => {
  const result = processTest([ 'print "exec3"', '12 print "foo"' ], -1, null, false)

  assert.is(result.actions.length, 7)
  assert.is(result.editorLines[0], '5 PRINT "top"\n')
  assert.is(result.editorLines[1], '11 PRINT "topcut"\n')
  assert.is(result.editorLines[2], '12 PRINT "foo"\n')
  assert.is(result.editorLines[3], '14 PRINT "midcut"\n')
  assert.is(result.editorLines[4], '15 PRINT "newline"\n')
  assert.is(result.editorLines[5], '16 PRINT "newnew"\n')
  assert.is(result.editorLines[6], '17 GOTO 14\n')
  assert.is(result.editorLines[7], '18 PRINT "bottomcut"\n')
  assert.is(result.editorLines[8], '19 GOTO 10\n')
  assert.is(result.editorLines[9], '20 syntax error\n')
  assert.is(result.editorLines[10], 'PRINT "exec"\n')
  assert.is(result.editorLines[11], 'PRINT "exec2"\n')
  assert.is(result.editorLines[12], 'PRINT "exec3"\n')
  assert.is(result.cursorLine, 14)
  assert.is(result.editorLines.length, 13)
  assert.is(machine.runCodespace.lineNumbers.length , 10)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 10)
})

test('issue #110 - messed up order on line insert', async () => {
  addProgram(machine, [
    '10 PRINT "something";',
    '20 INPUT base',
    '30 INPUT "another thing";power'
  ])
  const result = processTest(
    '10 INPUT "something";base', 4,
    '10 PRINT "something"\n'+
    '20 INPUT base\n' +
    '30 INPUT "another thing";power\n'
    , true)

  assert.is(result.actions.length, 3)
  assert.is(result.editorLines[0], '10 INPUT "something";base\n')
  assert.is(result.editorLines[1], '20 INPUT base\n')
  assert.is(result.editorLines[2], '30 INPUT "another thing";power\n')
  assert.is(result.cursorLine, 2)
  assert.is(result.editorLines.length, 3)
  assert.is(machine.runCodespace.lineNumbers.length , 3)
  assert.is(Object.keys(machine.runCodespace.codeLines).length, 3)
})

test.run()