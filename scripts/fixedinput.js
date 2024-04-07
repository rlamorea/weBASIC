import { displayString, getCell, scrollScreen } from './fixedscreen.js'

const insertCursorHeightPct = 0.1
const cursorHeightIncrement = 0.2
const overwriteCursorHeightPct = 0.5

const defaultMaxLength = 160
const defaultWarnZone = 10 // from end

// key handling
window.addEventListener('load', (event) => {
  window.addEventListener('keydown', (e) => { keyDown(e) })
  window.addEventListener('keypress', (e) => { e.preventDefault() })
  window.addEventListener('keyup', (e) => { keyUp(e) })
})

let registeredInput = null

function keyDown(evt) {
  evt.preventDefault()
  // TODO: later?
}

function keyUp(evt) {
  evt.preventDefault()
  if (!registeredInput) return // do nothing
  registeredInput.handleKey(evt)
}

export default class FixedInput {
  constructor(screenDiv, startLocation, options) {
    options = options || {}
    this.screen = screenDiv
    this.cursorLocation = [...startLocation]
    this.options = options

    this.mode = options.insertMode || 'insert'

    this.maxLength = options.maxLength || defaultMaxLength
    this.warnLength = options.warnLength || Math.max(0, this.maxLength - defaultWarnZone)

    this.cursorMovingFrom = null
    this.inputText = ''
    this.cursorInputIndex = 0

    if (options.singleLine) { // prep for horizontal scrolling
      // TODO
    } else { // ensure screen can display full input text
      const burnedLength = this.cursorLocation[0] - 1
      const linesNeeded = this.screen.dataset.rows - (this.cursorLocation[1] + Math.ceil((this.maxLength + burnedLength) / this.screen.dataset.columns))
      if (linesNeeded < 0) {
        const offset = scrollScreen(0, linesNeeded)
        this.cursorLocation[0] += offset[0]
        this.cursorLocation[1] += offset[1]
      }
    }

    this.cursor(true)

    this.keyHandlers = {
      'F1': this.doFuncKey,  'F2': this.doFuncKey,  'F3': this.doFuncKey,  'F4': this.doFuncKey,
      'F5': this.doFuncKey,  'F6': this.doFuncKey,  'F7': this.doFuncKey,  'F8': this.doFuncKey,
      'F9': this.doFuncKey, 'F10': this.doFuncKey, 'F11': this.doFuncKey, 'F12': this.doFuncKey,
      'Backspace': this.doBackspace, 'Tab': this.doTab, 'Enter': this.doEnter,
      'ArrowLeft': this.doArrow, 'ArrowRight': this.doArrow,
      'ArrowUp': this.doArrow, 'ArrowDown': this.doArrow
    }

    registeredInput = this
  }

  calcCursorHeight(increment) {
    increment = increment || 0.0
    return (this.screen.dataset.fontHeight * ((this.mode ? insertCursorHeightPct : overwriteCursorHeightPct) + increment)) + 'px'
  }

  cursor(show) {
    const cell = getCell(this.screen, this.cursorLocation[0], this.cursorLocation[1])
    if (show) {
      let cursorClasses = [ 'cursor' ]
      if (show && this.inputText.length >= this.maxLength) {
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
    // stop cursor at current location
    this.cursor(false)

    // handle special characters
    if (evt.key.length > 1) {
      let handler = this.keyHandlers[evt.key]
      if (handler) {
        handler = handler.bind(this)
        handler(evt.key, evt)
      }
    } else {
      // update cell contents
      const cell = getCell(this.screen, this.cursorLocation[0], this.cursorLocation[1])
      if (cell.dataset.tempChar) { cell.dataset.tempChar = false }
      cell.innerHTML = evt.key

      if (this.cursorInputIndex === this.maxLength - 1) {
        if (this.inputText.length < this.maxLength) {
          this.inputText += evt.key
        } else {
          this.inputText = this.inputText.slice(0, -1) + evt.key
        }
      } else {
        this.cursorInputIndex += 1
        this.inputText += evt.key

        // advance cursor location
        this.cursorLocation[0] += 1
        if (this.cursorLocation[0] > this.screen.dataset.columns) {
          this.cursorLocation[0] = 1
          this.cursorLocation[1] += 1
          // TODO: deal with overflow later
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

    const cursorAtEndOfLine = (this.cursorInputIndex === this.inputText.length - 1)
    const atFullLength = (cursorAtEndOfLine && this.inputText.length === this.maxLength)

    if (cursorAtEndOfLine) {
      this.inputText = this.inputText.slice(0, -1)
    } else {
      this.inputText = this.inputText.substring(0, this.cursorInputIndex - 1) + this.inputText.substring(this.cursorInputIndex + 1)
    }

    if (!atFullLength) {
      this.cursorInputIndex -= 1
      this.cursorLocation[0] -= 1
      if (this.cursorLocation[0] < 1) {
        this.cursorLocation[0] = this.screen.dataset.columns
        this.cursorLocation[1] -= 1
        // NOTE: in LIVE mode this should never go past top of screen -- but need to think it through
      }
    }

    // clear cell deleted
    const cell = getCell(this.screen, this.cursorLocation[0], this.cursorLocation[1])
    if (cell.dataset.tempChar) { cell.dataset.tempChar = false }
    cell.innerHTML = ''

    if (!cursorAtEndOfLine) {
      displayString(this.screen, this.cursorLocation[0], this.cursorLocation[1], this.inputText.substring(this.cursorInputIndex))
    }
  }

  doTab(key, evt) {

  }

  doEnter(key, evt) {

  }

  doArrow(key, evt) {

  }
}
