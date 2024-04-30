import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'
import * as monaco from 'monaco-editor'
// or import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// if shipping only a subset of the features & languages is desired

import Lexifier from '../../interpreter/lexifier.js'

const defaultMessage = 'weBASIC 0.1 EDIT mode'
const maximumLineLength = 160
const warnLineLength = 150

const overwriteKeys = {
  Backquote: true, // 91
  Backslash: true, // 93
  BracketLeft: true, // 92
  BracketRight: true, // 94
  Comma: true, // 87
  Equal: true, // 86
  IntlBackslash: true, // 97
  Minus: true, // 88
  Period: true, // 89
  Quote: true, // 95
  Semicolon: true, // 85
  Slash: true, // 90
  Space: true, // 10
  // Tab', // 2 -- TODO!
}
const overwriteKeyGroups = [
  'Digit', // 21 - 30
  'Key', // 31-56
  'Numpad', // 98-113
]

// NOTE: full list of colors here - https://github.com/microsoft/monaco-editor/issues/1631
monaco.editor.defineTheme('weBASIC', {
  base: 'vs', inherit: true, rules: [],
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#ffffff',
    'editorCursor.foreground': '#ffffff',
  }
})

// TODO: using model markers owner as "eslint" because it works, but need own this eventually

export default class EditorScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = document.createElement('div')
    div.id = 'editor-screen'
    div.classList.add('chargrid', 'fixed')
    document.body.appendChild(div)
    options.panel = { location: 'bottom', rows: 2 }
    super('editor-screen', div, machine, options)
    this.lexifier = new Lexifier()
  }

  initialized() {
    this.div.style.display = 'none' // show it
    this.firstActivated = false

    for (let column = 1; column <= this.viewportSize[0]; column++) {
      const cell = this.getCell([ column, 1 ])
      cell.classList.add('inverted')
    }
    this.moveTo( [ 1, 2 ])
    this.commandInput = new FixedInput(this, { singleLine: true })
  }

  activated(active) {
    if (!active || this.firstActivated) { return }

    this.editorDiv = document.createElement('div')
    this.editorDiv.style.position = 'absolute'
    this.editorDiv.style.top = `-${this.panelSettings.borderOffset.bottom}px`
    this.editorDiv.style.left = '0'
    this.editorDiv.style.width = '100%'
    this.editorDiv.style.height = this.panelSettings.borderOffset.bottom + 'px'

    this.div.appendChild(this.editorDiv)

    this.editor = monaco.editor.create(this.editorDiv, {
      lineNumbers: false,
      fontFamily: 'monospace',
      fontSize: `${this.fontSize}px`,
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      minimap: { enabled: false },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      cursorStyle: 'underline',
      renderLineHighlight: 'none',
      letterSpacing: `${this.letterSpacing}px`,
      scrollBeyondLastLine: false,
      scrollBar: { horizontal: "hidden" },
      wordWrap: 'on',
      theme: 'weBASIC',
      value: '',
      language: 'weBASIC'
    });

    console.log(monaco.KeyMod.CtrlCmd, monaco.KeyCode.KeyI, monaco.KeyCode.Enter)

    this.editor.addCommand(monaco.KeyCode.Enter, (accessor) => { this.processLine() })
    // this.editor.addCommand(
    //   monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
    //   (accessor) => { this.updateInsertOverwrite('toggle') }
    // )
    this.editor.onKeyDown( (accessor) => { this.keyDown(accessor) })

    // set up insert/overwrite tracking
    this.insertMode = 'insert'
    const overInsWidth = this.viewportSize[0] <= 20 ? 2 : 4
    this.overInsDisp = {
      column: this.viewportSize[0] - overInsWidth + 1,
      insert: overInsWidth === 2 ? 'I' : 'INS',
      overwrite: overInsWidth === 2 ? 'O' : 'OVR'
    }
    this.updateInsertOverwrite()

    // set up cursor tracking
    const columnPadding = this.viewportSize[0] < 100 ? 2 : 3
    const cursorGap = this.viewportSize[0] <= 20 ? '' : ' '
    const lineOrRow = this.viewportSize[0] <= 20 ? 'R' : 'L'
    const rowPadding = this.viewportSize[0] <= 20 ? 2 : 5
    this.cursorPosDisp = {
      columnPadding, gap: cursorGap, lineOrRow, rowPadding,
      column: this.viewportSize[0] - (1 + columnPadding + cursorGap.length + 1 + rowPadding + 1 + overInsWidth) + 1
    }
    this.editor.onDidChangeCursorPosition( (e) => {
      this.updateCursorPosition([ e.position.column, e.position.lineNumber ])
    })
    this.updateCursorPosition([ 1, 1 ])

    this.messageWidth = this.cursorPosDisp.column - 2
    this.displayMessage(defaultMessage)
    this.currentErrorMarker = null
    this.cursorStyle = 'underline'

    this.setMode('edit')
  }

  updateInsertOverwrite(newMode) {
    const origMode = this.insertMode
    if (newMode === 'toggle') {
      newMode = this.insertMode === 'insert' ? 'overwrite' : 'insert'
    } else {
      newMode = this.insertMode
    }
    this.displayStringAt([ this.overInsDisp.column, 1 ], this.overInsDisp[newMode], false)
    if (origMode !== newMode) { 
      this.insertMode = newMode
      const cursorStyle = this.insertMode === 'insert' ? 'underline' : 'block'
      this.editor.updateOptions({ cursorStyle })
      this.cursorStyle = cursorStyle
    }
  }

  updateCursorPosition(cursorPos) {
    if (this.viewportSize[0] < 20) return // do nothing
    let row = cursorPos[1]
    if (this.cursorPosDisp.lineOrRow === 'R') {
      row = (row - this.editor.getVisibleRanges()[0].startLineNumber) + 1
    }
    let posString = `C${cursorPos[0].toString().padEnd(this.cursorPosDisp.columnPadding)}`
    posString += this.cursorPosDisp.gap
    posString += `${this.cursorPosDisp.lineOrRow}${row.toString().padEnd(this.cursorPosDisp.rowPadding)}`
    this.displayStringAt([ this.cursorPosDisp.column, 1 ], posString, false)
  }

  setMode(newMode) {
    const commandMode = newMode === 'command'
    this.editor.updateOptions({ readOnly: commandMode })
    this.commandInput.activate(commandMode)
    this.machine.io.setActiveListener(commandMode ? this.commandInput : null)
    if (commandMode) {
      this.machine.io.enableBreak(true, 'Escape', () => { this.setMode('edit') })
      document.activeElement.blur()
      this.machine.io.useDefault(false)
    } else {
      this.machine.io.enableBreak(false)
      this.editor.focus()
      this.machine.io.useDefault(true, 'Escape', () => { this.setMode('command') })
    }
  }

  processLine() {
    this.clearError()
    const position = this.editor.getPosition()
    const lineNumber = position.lineNumber
    const lines = this.editor.getValue().split('\n')
    let lineValue = lines[lineNumber - 1]
    let trimmedLineValue = lineValue.trim()
    const model = this.editor.getModel()
    if (trimmedLineValue.length !== lineValue.length) {
      this.editor.executeEdits("", [{
        range: new monaco.Range(lineNumber, 1, lineNumber, lineValue.length + 1),
        text: trimmedLineValue
      }])
      lineValue = trimmedLineValue
    }
    if (lineValue.length > maximumLineLength) {
      trimmedLineValue = lineValue.substring(0, maximumLineLength)
      this.editor.executeEdits("", [{
        range: new monaco.Range(lineNumber, 1, lineNumber, lineValue.length + 1),
        text: trimmedLineValue
      }])
      lineValue = trimmedLineValue
      //this.displayError({ error: 'Line Too Long, Truncated', location: maximumLineLength, endLocation: lineValue.length }, lineNumber)
    }
    if (lineValue !== '') {
      const result = this.lexifier.lexifyLine(lineValue, true)
      if (result.error) {
        this.displayError(result, lineNumber)
      } else {
        let edits = []
        for (const cleanToken of this.lexifier.identifyCleanTokens(lineValue)) {
          edits.push({
            range: new monaco.Range(lineNumber, cleanToken.start + 1, lineNumber, cleanToken.end + 1),
            text: cleanToken.replace
          })
        }
        this.editor.executeEdits("", edits)
      }
    }
    if (lineNumber === lines.length || position.column === 1) {
      if (position.column > 1) { this.editor.setPosition({ column: lineValue.length + 1, lineNumber }) }
      this.editor.trigger('keyboard', 'type', { text: '\n' })
    } else {
      this.editor.setPosition({ column: 1, lineNumber: lineNumber + 1 })
    }
  }

  keyDown(key) {
    if (key.code === 'KeyI' && key.ctrlKey) {
      this.updateInsertOverwrite('toggle')
      return
    }
    const model = this.editor.getModel()
    const position = this.editor.getPosition()
    const lineValue = model.getLineContent(position.lineNumber)
    let cursorStyle = (lineValue.length >= warnLineLength) ? 'block-outline' : 'underline'
    if (this.insertMode === 'overwrite') {
      cursorStyle = 'block'
      let keyOk = overwriteKeys[key.code]
      if (!keyOk) {
        for (const keyGroup of overwriteKeyGroups) {
          if (key.code.startsWith(keyGroup)) {
            keyOk = true
            break
          }
        }
      }
      if (keyOk) {
        this.editor.executeEdits("", [{
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + 1),
          text: ''
        }])
      }
    }
    if (lineValue.length >= maximumLineLength - 1) {
      cursorStyle = 'block'
      const trimmedLineValue = lineValue.substring(0, maximumLineLength - 1)
      this.editor.executeEdits("", [{
        range: new monaco.Range(position.lineNumber, 1, position.lineNumber, lineValue.length + 1),
        text: trimmedLineValue
      }])
    }
    if (this.cursorStyle !== cursorStyle) {
      this.editor.updateOptions({ cursorStyle })
      this.cursorStyle = cursorStyle
    }
    if (!this.currentErrorMarker) return
    const lineNumber = this.editor.getPosition().lineNumber
    if (this.currentErrorMarker.startLineNumber === lineNumber) { this.clearError() }
  }

  displayMessage(message) {
    message = (message.length > this.messageWidth) ? message.length.substring(0, this.messageWidth) : message.padEnd(this.messageWidth)
    this.displayStringAt([ 1, 1 ], message)
  }

  displayError(error, lineNumber) {
    this.displayMessage(error.error)
    this.currentErrorMarker = {
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
      startColumn: error.location + 1,
      endColumn: error.endLocation + 1,
      message: error.error,
      severity: 3,
      source: 'weBASIC'
    }
    const model = this.editor.getModel()
    monaco.editor.setModelMarkers(model, 'eslint', [ this.currentErrorMarker ])
  }

  clearError() {
    this.currentErrorMarker = null
    const model = this.editor.getModel()
    monaco.editor.setModelMarkers(model, 'eslint', [ ])
    this.displayMessage(defaultMessage)
  }
}