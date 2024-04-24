import nextToken from "../../interpreter/tokenizer.js"

const insertCursorHeightPct = 0.1
const cursorHeightIncrement = 0.2
const overwriteCursorHeightPct = 0.5

const defaultMaxLength = 160
const defaultWarnZone = 10 // from end
const defaultMinimumInputWidth = 10

const separatorCharacters = " ()[]{};:,./?"

const keywordCodings = [ 'keyword', 'function', 'statement', 'command', 'binary-operator', 'unary-operator' ]

// key handling
const nonRepeatableKeys = [ 'Alt', 'Meta', 'Control', 'Shift', 'Escape', 'CapsLock', 'Enter' ]

window.addEventListener('load', (event) => {
  window.addEventListener('keydown', (e) => { keyDown(e) })
  window.addEventListener('keypress', (e) => { e.preventDefault() })
  window.addEventListener('keyup', (e) => { keyUp(e) })
})

let registeredInput = null
let repeatKeyDown = null
const repeatStartDelay = 500
const repeatDelay = 250

function keyDown(evt) {
  evt.preventDefault()
  if (!registeredInput) return // do nothing
  registeredInput.handleKey(evt)
  if (nonRepeatableKeys.indexOf(evt.key) < 0) {
    repeatKeyDown = evt
    setTimeout( () => { repeatKey(evt) }, repeatStartDelay)
  }
}

function repeatKey(keyEvt) {
  if (keyEvt !== repeatKeyDown) return
  console.log('repeating', keyEvt.key)
  keyDown(keyEvt)
  setTimeout(() => { repeatKey(keyEvt) }, repeatDelay)
}

function keyUp(evt) {
  evt.preventDefault()
  // TOOD: figure out if we are keeping part of a key sequence down
  repeatKeyDown = null
}

export default class FixedInput {
  constructor(screen, options) {
    options = options || {}
    this.screen = screen
    this.cursorLocation = [...(options.startLocation || screen.viewportCursorLocation)]

    this.mode = options.insertMode || 'insert'

    this.maxLength = options.maxLength || defaultMaxLength
    this.warnLength = options.warnLength || Math.max(0, this.maxLength - defaultWarnZone)

    this.inputText = ''
    this.cursorInputIndex = 0
    this.typeMode = 'insert'

    this.cursorLocation = [ ...this.screen.viewportCursorLocation ]
    this.singleLine = options.singleLine
    if (this.singleLine) { // prep for horizontal scrolling
      this.singleLineStartIndex = 0
      this.singleLineViewLength = this.screen.viewportSize[0] - this.cursorLocation[0] + 1 // this is the number of cells available
      if (this.cursorLocation[0] > 1 && this.singleLineViewLength < defaultMinimumInputWidth) {
        this.screen.newline()
        this.cursorLocation = [ ...this.screen.viewportCursorLocation ]
        this.singleLineViewLength = this.screen.viewportSize[0] // hopefully that's big enough, if not, oh well
      }
    } else { // ensure screen can display full input text
      this.screen.ensureLines(this.screen.linesRequired(this.maxLength))
      this.cursorLocation = [...this.screen.viewportCursorLocation]
    }
    this.cursorStart = [...this.cursorLocation]
    this.cursorEnd = [...this.cursorLocation]

    this.keyHandlers = {
      'F1': this.doFuncKey,  'F2': this.doFuncKey,  'F3': this.doFuncKey,  'F4': this.doFuncKey,
      'F5': this.doFuncKey,  'F6': this.doFuncKey,  'F7': this.doFuncKey,  'F8': this.doFuncKey,
      'F9': this.doFuncKey, 'F10': this.doFuncKey, 'F11': this.doFuncKey, 'F12': this.doFuncKey,
      'Backspace': this.doBackspace, 'Tab': this.doTab, 'Enter': this.doEnter,
      'ArrowLeft': this.doArrow, 'ArrowRight': this.doArrow,
      'ArrowUp': this.doArrow, 'ArrowDown': this.doArrow,
      'i': this.doToggleMode, 'I': this.doToggleMode
    }

    this.inputHandler = options.inputHandler
    this.active = true

    if (options.prefill) {
      this.inputText = options.prefill.length > this.maxLength ? options.prefill.substring(0, this.maxLength) : options.prefill
      let dispString = this.inputText
      if (this.singleLine && this.inputText.length >= this.singleLineViewLength) {
        dispString = this.inputText.substring(0, this.singleLineViewLength)
      }
      this.screen.displayString(dispString, false)
      if (this.inputText.length === this.maxLength || (this.singleLine && dispString.length < this.inputText.length)) { // pull back one
        this.screen.moveBy(-1, 0)
      }
      this.cursorEnd = [ ...this.screen.viewportCursorLocation ]
      this.screen.moveTo([ ...this.cursorLocation ])
    }
    this.hasError = false
    // NOTE that single line mode does not support error highlight at this time
    if ('errorLocation' in options && !this.singleLine) {
      const errorLocation = Math.min(options.errorLocation, this.maxLength)
      const endLocation = Math.min((options.errorEndLocation || errorLocation) + 1, this.maxLength)
      let errorLoc = [ ...this.cursorLocation ]
      this.screen.advanceCursorFrom(errorLoc, errorLocation)
      for (let loc = errorLocation; loc < endLocation; loc++) {
        const cell = this.screen.getCell(errorLoc)
        cell.classList.add('error')
        this.screen.advanceCursorFrom(errorLoc)
      }
      this.hasError = true
    }

    this.cursor(true)

    registeredInput = this
  }

  clearError() {
    if (!this.hasError) return
    let loc = [ ...this.cursorStart ]
    for (let idx = 0; idx < this.inputText.length; idx++) {
      const cell = this.screen.getCell(loc)
      cell.classList.remove('error')
      this.screen.advanceCursorFrom(loc)
    }
    this.hasError = false
  }

  shiftSingleLineViewport() {
    let strStart = this.singleLineStartIndex
    let strEnd = strStart + this.singleLineViewLength
    let extraSpace = true
    if (this.inputText.length === this.maxLength) {
      strStart -= 1 // pull back one
      extraSpace = false
    }
    const viewportStr = this.inputText.substring(strStart, strEnd)
    this.screen.displayStringAt(this.cursorStart, viewportStr, false)
    if (extraSpace) { this.screen.displayChar('') }
    this.screen.viewportCursorLocation = [ ...this.cursorLocation ]
    // this.screen.moveBy(-1, 0)
    // this.cursorLocation = [ ...this.screen.viewportCursorLocation ]
    // this.cursorEnd = [ ...this.cursorLocation ]
  }

  cursor(show) {
    const cell = this.screen.getCell(this.cursorLocation)
    if (show) {
      let cursorClasses = [ 'cursor' ]
      if (show && (this.typeMode === 'overwrite' || this.inputText.length >= this.maxLength)) {
        cursorClasses.push('overwrite')
      } else if (show && this.inputText.length >= this.warnLength) {
        cursorClasses.push('warn')
      }
      cell.classList.add(...cursorClasses)
    } else {
      cell.classList.remove('cursor', 'warn', 'overwrite')
    }
  }

  handleKey(evt) {
    if (!this.active) return
    // stop cursor at current location
    this.cursor(false)

    // handle special characters
    let keyHandled = false
    let handler = this.keyHandlers[evt.key]
    if (handler) {
      handler = handler.bind(this)
      keyHandled = handler(evt.key, evt)
    }
    if (!this.active) { return }

    if (!keyHandled && evt.key.length === 1) {
      if (this.hasError) { this.clearError() }
      // insert mode works as insert until line is full, then turns into overwrite mode automatically
      // update cell contents
      const cell = this.screen.getCell(this.cursorLocation)
      if (cell.dataset.tempChar) { cell.dataset.tempChar = false }
      cell.innerHTML = evt.key

      let replaceCurrentChar = false
      let advanceCursor = false

      if (this.cursorInputIndex === this.maxLength - 1 && this.inputText.length < this.maxLength) {
        this.inputText += evt.key
      } else if (this.cursorInputIndex === this.maxLength - 1) {
        replaceCurrentChar = true
      } else if (this.cursorInputIndex === this.inputText.length) {
        this.inputText += evt.key
        advanceCursor = true
      } else if (this.typeMode === 'overwrite' || this.inputText.length === this.maxLength) {
        replaceCurrentChar = true
        advanceCursor = true
      } else {
        advanceCursor = true
        this.inputText = this.inputText.substring(0, this.cursorInputIndex) + evt.key + this.inputText.substring(this.cursorInputIndex)
        let cellLoc = [...this.cursorLocation]
        for (let idx = this.cursorInputIndex + 1; idx < this.inputText.length; idx++) {
          if (this.singleLine && idx > (this.singleLineStartIndex + this.singleLineViewLength - 1)) { break }
          this.screen.advanceCursorFrom(cellLoc)
          const moveCell = this.screen.getCell(cellLoc)
          moveCell.innerHTML = this.inputText[idx]
        }
        if (this.inputText.length < this.maxLength) { this.screen.advanceCursorFrom(cellLoc) }
        // since we moved the end of line, capture the cursor location as new end
        this.cursorEnd = [ ...this.screen.viewportCursorLocation  ]
      }

      if (replaceCurrentChar) {
        const pre = (this.cursorInputIndex === 0) ? '' : this.inputText.substring(0, this.cursorInputIndex)
        const post = (this.cursorInputIndex === this.inputText.length - 1) ? '' : this.inputText.substring(this.cursorInputIndex + 1)
        this.inputText = pre + evt.key + post
      }

      if (advanceCursor) {
        this.cursorInputIndex += 1
        if (this.singleLine && this.cursorInputIndex > (this.singleLineStartIndex + this.singleLineViewLength - 1)) {
          this.singleLineStartIndex += 1
          this.shiftSingleLineViewport()
        } else {
          this.screen.advanceCursorFrom(this.cursorLocation)
          if (this.cursorInputIndex === this.inputText.length) {
            this.cursorEnd = [ ...this.cursorLocation ]
          }
        }
      }
    }
    // restart cursor
    this.cursor(true)
  }

  doFuncKey(key, evt) {
    // TODO: nothing for now
  }

  doBackspace(key, evt) {
    // do nothing if at start of command line
    if (this.cursorInputIndex === 0) return

    if (this.hasError) { this.clearError() }

    let moveCursorBackOne = false
    let shiftCells = false

    if (this.cursorInputIndex === this.maxLength - 1 && this.inputText.length === this.maxLength) {
      this.inputText = this.inputText.slice(0, -1)
    } else if (this.cursorInputIndex === this.inputText.length) {
      this.inputText = this.inputText.slice(0, -1)
      moveCursorBackOne = true
    } else {
      moveCursorBackOne = true
      const pre = (this.cursorInputIndex > 1) ? this.inputText.substring(0, this.cursorInputIndex - 1) : ''
      const post = this.inputText.substring(this.cursorInputIndex)
      this.inputText = pre + post
      shiftCells = true
    }

    if (moveCursorBackOne) {
      if (this.singleLine && this.singleLineStartIndex > 0) {
        this.singleLineStartIndex -= 1
        this.shiftSingleLineViewport()
      } else {
        this.cursorLocation[0] -= 1
        if (this.cursorLocation[0] < 1) {
          this.cursorLocation[0] = this.screen.viewportSize[0]
          this.cursorLocation[1] -= 1
        }
      }
      this.cursorInputIndex -= 1
      if (this.cursorInputIndex === this.inputText.length) {
        this.cursorEnd = [...this.cursorLocation]
      }
    }

    const cell = this.screen.getCell(this.cursorLocation)
    cell.innerHTML = ''

    if (shiftCells) {
      let cellLoc = [...this.cursorLocation]
      for (let idx = this.cursorInputIndex; idx <= this.inputText.length; idx++) {
        const cell = this.screen.getCell(cellLoc)
        cell.innerHTML = (idx === this.inputText.length) ? '' : this.inputText[idx]
        if (cell.innerHTML === '') { this.cursorEnd = [...cellLoc] }
        this.screen.advanceCursorFrom(cellLoc)
      }
    }

    return true
  }

  doTab(key, evt) {

  }

  doEnter(key, evt) {
    // upcase all keyword tokens
    let tokenStart = 0
    let upcaseIdx = 0
    let upcaseLoc = [ ...this.cursorStart ]
    let parseLine = this.inputText
    while (1 === 1) {
      const tokenDef = nextToken(parseLine, tokenStart)
      if (tokenDef.restOfLine === null) {
        break
      }
      if (keywordCodings.includes(tokenDef.coding)) {
        this.screen.advanceCursorFrom(upcaseLoc, tokenDef.tokenStart - upcaseIdx)
        for (let idx = 0; idx < tokenDef.token.length; idx++) {
          const tokenChar = tokenDef.token[idx]
          const tokenCell = this.screen.getCell(upcaseLoc)
          tokenCell.innerHTML = tokenChar
          this.screen.advanceCursorFrom(upcaseLoc)
        }
        const pre = (tokenDef.tokenStart === 0) ? '' : this.inputText.substring(0, tokenDef.tokenStart)
        const post = (tokenDef.tokenEnd < this.inputText.length) ? this.inputText.substring(tokenDef.tokenEnd) : ''
        this.inputText = pre + tokenDef.token + post
        upcaseIdx = tokenDef.tokenEnd
      }
      tokenStart = tokenDef.tokenEnd
      parseLine = tokenDef.restOfLine
    }

    // move the screen cursor past the entered line
    this.screen.moveTo(this.cursorEnd)
    this.screen.newline()
    if (this.inputHandler) {
      this.inputHandler(this.inputText)
      this.active = false
    }
  }

  doArrow(key, evt) {
    if ((evt.metaKey || evt.ctrlKey && evt.altKey) && key === "ArrowLeft") { // sol
      this.cursorInputIndex = 0
      this.cursorLocation = [ ...this.cursorStart ]
      if (this.singleLine && this.singleLineStartIndex > 0) {
        this.singleLineStartIndex = 0
        this.shiftSingleLineViewport()
      }
    } else if ((evt.metaKey || evt.ctrlKey && evt.altKey) && key === "ArrowRight") { // eol
      this.cursorInputIndex = (this.inputText.length === this.maxLength) ? this.maxLength - 1 : this.inputText.length
      this.cursorLocation = [ ...this.cursorEnd ]
      if (this.singleLine && this.cursorInputIndex > this.singleLineViewLength) {
        this.singleLineStartIndex = this.cursorInputIndex - this.singleLineViewLength + 1
        this.shiftSingleLineViewport()
      }
    } else if (evt.altKey && key === "ArrowLeft") { // start of word
      if (this.cursorInputIndex > 0) {
        let csrIdx = this.cursorInputIndex
        while (csrIdx > 0) {
          if (separatorCharacters.indexOf(this.inputText[csrIdx]) >= 0 && csrIdx < this.cursorInputIndex -1) {
            csrIdx += 1 // move to start of word
            break
          }
          csrIdx -= 1
        }
        if (this.singleLine && csrIdx < this.singleLineStartIndex) {
          this.singleLineStartIndex = csrIdx
          this.shiftSingleLineViewport()
          this.cursorLocation = [ ...this.cursorStart ]
        } else if (csrIdx === 0) {
          this.cursorLocation = [...this.cursorStart]
        } else {
          for (let idx = this.cursorInputIndex; idx > csrIdx; idx--) {
            this.cursorLocation[0] -= 1
            if (this.cursorLocation[0] < 1) {
              this.cursorLocation[0] = this.screen.viewportSize[0]
              this.cursorLocation[1] -= 1
            }
          }
        }
        this.cursorInputIndex = csrIdx
      }
    } else if (evt.altKey && key === "ArrowRight") {
      if (this.cursorInputIndex < this.maxLength - 1 && this.cursorInputIndex < this.inputText.length) {
        let csrIdx = this.cursorInputIndex
        while (csrIdx < Math.min(this.maxLength -1, this.inputText.length)) {
          if (separatorCharacters.indexOf(this.inputText[csrIdx]) >= 0 && csrIdx > this.cursorInputIndex + 1) { break }
          csrIdx += 1
        }
        if (this.singleLine && csrIdx >= this.singleLineViewLength) {
          this.singleLineStartIndex = csrIdx - this.singleLineViewLength + 1
          this.shiftSingleLineViewport()
          this.cursorLocation = [ ...this.cursorEnd ]
        } else if (csrIdx === this.maxLength - 1) {
          this.cursorLocation = [...this.cursorEnd]
        } else {
          for (let idx = this.cursorInputIndex; idx < csrIdx; idx++) {
            this.cursorLocation[0] += 1
            if (this.cursorLocation[0] > this.screen.viewportSize[0]) {
              this.cursorLocation[0] = 1
              this.cursorLocation[1] += 1
            }
          }
        }
        this.cursorInputIndex = csrIdx
      }
    } else if (key === "ArrowLeft") {
      if (this.cursorInputIndex > 0) {
        this.cursorInputIndex -= 1
        if (this.singleLine && this.cursorInputIndex < this.singleLineStartIndex) {
          this.singleLineStartIndex -= 1
          this.shiftSingleLineViewport()
        } else {
          this.cursorLocation[0] -= 1
          if (this.cursorLocation[0] < 1) {
            this.cursorLocation[0] = this.screen.viewportSize[0]
            this.cursorLocation[1] -= 1
          }
        }
      }
    } else if (key === "ArrowRight") {
      if (this.cursorInputIndex < this.inputText.length && this.cursorInputIndex < this.maxLength - 1) {
        this.cursorInputIndex += 1
        if (this.singleLine && this.cursorInputIndex >= this.singleLineViewLength) {
          this.singleLineStartIndex += 1
          this.shiftSingleLineViewport()
          if (this.cursorLocation[0] < this.screen.viewportSize[0]) {
            this.cursorLocation[0] += 1
          }
        } else {
          this.cursorLocation[0] += 1
          if (this.cursorLocation[0] > this.screen.viewportSize[0]) {
            this.cursorLocation[0] = 1
            this.cursorLocation[1] += 1
          }
        }
      }
    }
    return true
  }

  doToggleMode(key, evt) {
    if (!evt.ctrlKey) { return false }
    this.typeMode = (this.typeMode === 'insert') ? 'overwrite' : 'insert'
    return true
  }
}
