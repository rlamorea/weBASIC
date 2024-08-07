import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'
import { version } from '../../config.js'
// import * as monaco from 'monaco-editor'
// or import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// if shipping only a subset of the features & languages is desired

import Lexifier from '../../interpreter/lexifier.js'
import { processLineActions } from "./editorLogic.js"
import { weBASICLanguage, weBASICTheme, weBASICConfig } from "./weBASICLanguage.js";

const defaultMessage = `weBASIC v${version} EDIT mode`
const maximumLineLength = 160
const warnLineLength = 150

let monaco = null

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

const allowedEditCommands = [
  'command|AUTO',
  'command|DEBUG',
  'command|EDIT',
  'command|FINE',
  'command|KEY',
  'command|LIST',
  'command|LIVE',
  'command|NEW',
  'command|RENUMBER',
  'command|RUN',
  'command|LOAD',
  'command|SAVE',
]

export default class EditorScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = options.screenDiv || document.createElement('div')
    div.id = 'editor-screen'
    div.classList.add('chargrid', 'fixed')
    document.body.appendChild(div)
    options.panel = { location: 'bottom', rows: 2 }
    super('editor-screen', div, machine, options)
    this.lexifier = new Lexifier()

    this.editor = options.editor
    this.mockEditor = options.mockEditor
    if (this.mockEditor) {
      monaco = options.monaco
    } else {
      import('monaco-editor').then( (module) => {
        monaco = module
      })
    }
  }

  initialized() {
    this.div.style.display = 'none' // show it
    this.firstActivated = false

    for (let column = 1; column <= this.viewportSize[0]; column++) {
      const cell = this.getCell([ column, 1 ])
      cell.classList.add('inverted')
    }
    this.moveTo( [ 1, 2 ])
    const self = this
    this.commandInput = new FixedInput(this, {
      singleLine: true,
      inputHandler: (input) => { self.handleCommand(input) },
      customKeyHandler: (evt) => {
        if (evt.ctrlKey && (evt.key === 'r' || evt.key === 'R')) {
          self.machine.reviewRunMode('EDIT')
          return true
        }
        return false
      }
    })
  }

  activated(active) {
    if (!monaco && !this.mockEditor) {
      setTimeout(() => { this.activated('waiting') }, 50)
    } else if (active === true && !this.firstActivated) {
      if (!this.mockEditor) {
        monaco.languages.register({ id: 'weBASIC' })
        monaco.languages.setMonarchTokensProvider('weBASIC', weBASICLanguage)
        monaco.languages.setLanguageConfiguration('weBASIC', weBASICConfig)
        monaco.editor.defineTheme('weBASIC-theme', weBASICTheme)

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
          minimap: {enabled: false},
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          cursorStyle: 'underline',
          renderLineHighlight: 'none',
          letterSpacing: `${this.letterSpacing}px`,
          scrollBeyondLastLine: false,
          scrollBar: {horizontal: "hidden"},
          wordWrap: 'on',
          theme: 'weBASIC-theme',
          value: '',
          language: 'weBASIC',
          bracketPairColorization: { enabled: false },
        });
      }

      this.editor.addCommand(monaco.KeyCode.Enter, (accessor) => {
        this.processLine()
      })
      this.editor.onKeyDown((accessor) => {
        this.keyDown(accessor)
      })

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
      this.editor.onDidChangeCursorPosition((e) => {
        this.updateCursorPosition([e.position.column, e.position.lineNumber])
      })
      this.editor.onDidPaste((e) => this.pastedCode(e))
      this.updateCursorPosition([1, 1])

      this.messageWidth = this.cursorPosDisp.column - 2
      this.displayMessage(defaultMessage)
      this.errorMarkers = {}
      this.currentErrorMessageKey = null
      this.cursorStyle = 'underline'
      this.firstActivated = true
      this.currentMode = 'startup'

      if (this.machine.runCodespace.lineNumbers.length > 0) {
        this.resetEditor()
      }
    }
    if (active === 'waiting') {
      if (!monaco) return
    } else {
      this.isActive = active
    }
    if (monaco && this.isActive) {
      this.setMode(this.currentMode)
    } else if (active !== 'waiting') {
      this.machine.io.useDefault(false)
      this.machine.io.setActiveListener()
    }
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

  showLines(startLine, endLine) {
    let startIndex = 0
    let endIndex = -1
    if (startLine >= 0) {
      const si = this.machine.execution.indexForLineNumber(this.machine.runCodespace, startLine, 'after')
      startIndex = si.lineIndex
    }
    if (endLine >= 0) {
      const ei = this.machine.execution.indexForLineNumber(this.machine.runCodespace, endLine, 'before')
      endIndex = ei.lineIndex
    }
    if (startIndex < 0) { startIndex = 0 }
    if (endIndex < 0) {
      this.editor.revealLineNearTop(startIndex + 1, 0)
    } else {
      this.editor.revealLinesNearTop(startIndex + 1, endIndex + 1, 0)
    }
    this.editor.setPosition({ lineNumber: startIndex + 1, column: 1 })
  }

  setMode(newMode) {
    if (this.currentMode === newMode) {
      if (newMode !== 'command' || (this.commandInput && this.machine.io.activeListener === this.commandInput)) {
        return // do nothing
      }
    }
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
    this.currentMode = newMode
  }

  getLineKey(lineValue) {
    const lineNumberCapture = lineValue.match(/^\s*(\d+)/)
    return lineNumberCapture ? parseInt(lineNumberCapture[1]) : lineValue
  }

  processLine() {
    const position = this.editor.getPosition()
    let screenLine = position.lineNumber
    const lines = this.editor.getValue().split('\n')
    if (screenLine < lines.length + 1 && position.column === 1) {
      this.editor.trigger('keyboard', 'type', { text: '\n' })
      return
    }

    let lineValue = lines[screenLine - 1]
    this.clearError(this.getLineKey(lineValue))
    this.cleanAndDisplayLine(lineValue, screenLine)
  }

  clearErrorsOnLines(startLine, endLine, captured) {
    const model = this.editor.getModel()
    for (let i = startLine; i <= endLine; i++) {
      const lineValue = model.getLineContent(i)
      const lineKey = this.getLineKey(lineValue)
      if (lineKey in this.errorMarkers) {
        captured[lineKey] = { marker: this.errorMarkers[lineKey], originalLine: lineValue }
        this.clearError(lineKey)
      }
    }
  }

  restoreErrorMarkers(lines, screenLine, captured) {
    let restoredCount = 0
    for (const line of lines) {
      const lineKey = this.getLineKey(line)
      let capturedMarker = captured[lineKey]
      if (capturedMarker && line === capturedMarker.originalLine) {
        capturedMarker.marker.startLineNumber = screenLine
        capturedMarker.marker.endLineNumber = screenLine
        this.errorMarkers[lineKey] = capturedMarker.marker
        restoredCount += 1
      }
    }
    if (restoredCount > 0) {
      const model = this.editor.getModel()
      monaco.editor.setModelMarkers(model, 'eslint', Object.values(this.errorMarkers))
    }
  }

  cleanAndDisplayLine(lineValue, screenLine = -1, stayInEdit = false) {
    // trim the line
    lineValue = lineValue.trim()
    // force to maximum line length
    if (lineValue.length > maximumLineLength) { lineValue = lineValue.substring(0, maximumLineLength) }

    if (lineValue === '' && screenLine < 0) { return }
    if (lineValue === '') {
      this.editor.executeEdits("", [{
        range: new monaco.Range(screenLine, 1, screenLine + 1, 1),
        text: '\n'
      }])
      return
    }

    let { cleanTokens, lineNumber: codeLineNumber, emptyLine } = this.lexifier.identifyCleanTokens(lineValue)
    if (!codeLineNumber && !stayInEdit) {
      this.editor.executeEdits("", [{
        range: new monaco.Range(screenLine, 1, screenLine + 1, 1),
        text: ''
      }])
      this.machine.activateMode('LIVE')
      this.machine.passCode(lineValue)
      return true
    }

    const actions = processLineActions(lineValue, screenLine, this.machine, this.editor.getValue(), codeLineNumber, cleanTokens)
    let cursorLine = screenLine
    let noError = true
    let capturedErrorMarkers = {}
    for (const action of actions) {
      switch (action.action) {
        case 'clearLine':
          const endScreenLine = (action.endScreenLine || action.screenLine) + 1
          this.clearErrorsOnLines(action.screenLine, endScreenLine - 1, capturedErrorMarkers)
          this.editor.executeEdits("", [{
            range: new monaco.Range(action.screenLine, 1, endScreenLine, 1),
            text: ''
          }])
          break
        case 'insertLine':
          this.editor.executeEdits("", [{
            range: new monaco.Range(action.screenLine, 1, action.screenLine, 1),
            text: action.value + '\n'
          }])
          if (action.error) {
            this.displayError(action.error, action.screenLine, this.getLineKey(action.value))
            noError = false
          } else {
            this.restoreErrorMarkers(action.value.split('\n'), action.screenLine, capturedErrorMarkers)
          }
          break
        case 'replaceLine':
          this.editor.executeEdits("", [{
            range: new monaco.Range(action.screenLine, 1, action.screenLine + 1, 1),
            text: action.value + '\n'
          }])
          if (action.error) {
            this.displayError(action.error, action.screenLine, this.getLineKey(action.value))
            noError = false
          }
          break
        case 'setLine':
          cursorLine = action.screenLine
          break
      }
    }
    this.editor.revealLine(cursorLine + 1)
    this.editor.setPosition({ column: 1, lineNumber: cursorLine })
    return noError
  }

  keyDown(key) {
    if (key.code === 'Enter' && key.ctrlKey) {
      key.preventDefault()
      key.stopPropagation()
      return
    }
    if (key.code === 'KeyR' && key.ctrlKey) {
      key.preventDefault()
      this.machine.reviewRunMode('EDIT')
      return
    }
    if (key.code === 'KeyI' && key.ctrlKey) {
      this.updateInsertOverwrite('toggle')
      key.preventDefault()
      return
    }
    if (key.code === 'KeyQ' && key.ctrlKey) {
      this.resetEditor()
      key.preventDefault()
      return
    }
    const model = this.editor.getModel()
    const position = this.editor.getPosition()
    const lineValue = model.getLineContent(position.lineNumber)
    if (key.code === 'KeyD' && key.ctrlKey) {
      key.preventDefault()
      key.stopPropagation()
      // delete eol
      if (position.column >= lineValue.length) { return } // skip this
      this.editor.executeEdits("", [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, lineValue.length + 1),
        text: ''
      }])
      return
    }
    if (key.code === 'KeyS' && key.ctrlKey) {
      key.preventDefault()
      key.stopPropagation()
      // delete sol
      if (position.column <= 1) { return }
      let lineNumber = (lineValue.trim().match(/^\d+/) || [])[0]
      if (lineNumber && lineValue.trim() === lineNumber.trim()) { lineNumber = null }
      let startCol = (lineNumber ? lineValue.indexOf(lineNumber) + lineNumber.length + 1 : 1)
      if (startCol >= position.column) { startCol = 1 }
      this.editor.executeEdits("", [{
        range: new monaco.Range(position.lineNumber, startCol, position.lineNumber, position.column),
        text: ''
      }])
      return
    }
    let cursorStyle = (lineValue.length >= warnLineLength) ? 'block-outline' : 'underline'

    let keyOk = false
    if (!key.altKey && !key.ctrlKey && !key.metaKey) {
      keyOk = overwriteKeys[key.code]
      if (!keyOk) {
        for (const keyGroup of overwriteKeyGroups) {
          if (key.code.startsWith(keyGroup)) {
            keyOk = true
            break
          }
        }
      }
    }

    if (this.insertMode === 'overwrite') {
      cursorStyle = 'block'
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
    if (keyOk) { this.clearError(this.getLineKey(lineValue)) }
  }

  displayMessage(message) {
    message = (message.length > this.messageWidth) ? message.length.substring(0, this.messageWidth) : message.padEnd(this.messageWidth)
    this.displayStringAt([ 1, 1 ], message)
  }

  pastedCode(e) {
    const pastedRange = e.range
    if (pastedRange.endLineNumber === pastedRange.startLineNumber) return // no new lines added
    // copy all of the code lines that were affected by the paste
    const model = this.editor.getModel()
    let changedLines = []
    let endLineNumber = pastedRange.endLineNumber + 1
    let endColumn = 1
    for (let lineNumber = pastedRange.startLineNumber; lineNumber <= pastedRange.endLineNumber; lineNumber++) {
      if (lineNumber === pastedRange.endLineNumber) {
        endColumn = pastedRange.endColumn
        endLineNumber = lineNumber
      } else {
        const lineRange = new monaco.Range(lineNumber, 1, lineNumber + 1, endColumn)
        changedLines.push(model.getValueInRange(lineRange).trim())
      }
    }
    // now cut all the complete lines
    this.editor.executeEdits("", [{
      range: new monaco.Range(pastedRange.startLineNumber, 1, pastedRange.startLineNumber + changedLines.length, 1),
      text: ''
    }])
    // now insert back all the lines
    let errorCount = 0
    for (const changeLine of changedLines) {
      if (!this.cleanAndDisplayLine(changeLine, -1, true)) {
        errorCount += 1
      }
    }
    this.editor.setPosition({ lineNumber: endLineNumber, column: endColumn })
    if (errorCount > 1) {
      this.displayError({ error: 'Multiple Errors' })
    }
  }

  resetEditor() {
    if (!this.editor) return
    let program = ''
    for (const lineNumber of this.machine.runCodespace.lineNumbers) {
      program += this.machine.runCodespace.codeLines[lineNumber].text + '\n'
    }
    this.editor.setValue(program)
    this.editor.setPosition({ lineNumber: this.machine.runCodespace.lineNumbers.length + 2, column: 1 })
  }

  displayError(error, lineNumber, lineKey, noMessage) {
    this.displayMessage(error.error)
    this.currentErrorMessageKey = lineKey
    if (lineKey) {
      this.errorMarkers[lineKey] = {
        startLineNumber: lineNumber,
        endLineNumber: lineNumber,
        startColumn: error.location + 1,
        endColumn: error.endLocation + 1,
        message: error.error,
        severity: 3,
        source: 'weBASIC'
      }
      const model = this.editor.getModel()
      monaco.editor.setModelMarkers(model, 'eslint', Object.values(this.errorMarkers))
    } else {
      this.currentErrorMessageKey = null
    }
  }

  clearError(key) {
    if (key in this.errorMarkers) {
      delete this.errorMarkers[key]
      const model = this.editor.getModel()
      monaco.editor.setModelMarkers(model, 'eslint', Object.values(this.errorMarkers))
    }
    if (this.currentErrorMessageKey === key || Object.keys(this.errorMarkers).length === 0) {
      this.displayMessage(defaultMessage)
    }
  }

  async handleCommand(input, passed) {
    if (passed) {
      this.setMode('edit')
      this.cleanAndDisplayLine(input)
      return
    }
    const { lineNumber } = this.lexifier.identifyCleanTokens(input)
    if (lineNumber) {
      this.commandInput.reset()
      this.setMode('edit')
      this.cleanAndDisplayLine(input)
      return
    }
    const result = await this.machine.runLiveCode(input, allowedEditCommands)
    if (result.error) { this.displayError(result) }
    this.commandInput.reset()
    let currentMode = this.currentMode
    this.currentMode = 'reset'
    this.setMode(currentMode)
    if (result.newMode) {
      this.machine.activateMode(result.newMode)
      if (result.prepNewMode) { await result.prepNewMode() }
    }
  }
}