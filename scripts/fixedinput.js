import { displayString, getCell, scrollScreen } from './fixedscreen.js'

const insertCursorHeightPct = 0.1
const cursorHeightIncrement = 0.2
const overwriteCursorHeightPct = 0.5

const defaultMaxLength = 20 //160
const defaultWarnZone = 10 // from end

const separatorCharacters = " ()[]{};:,./?"

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
    this.cursorStart = [...startLocation]
    this.cursorEnd = [...startLocation]
    this.options = options

    this.mode = options.insertMode || 'insert'

    this.maxLength = options.maxLength || defaultMaxLength
    this.warnLength = options.warnLength || Math.max(0, this.maxLength - defaultWarnZone)

    this.inputText = ''
    this.cursorInputIndex = 0
    this.typeMode = 'insert'

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
      'ArrowUp': this.doArrow, 'ArrowDown': this.doArrow,
      'i': this.doToggleMode, 'I': this.doToggleMode
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
    // stop cursor at current location
    this.cursor(false)

    // handle special characters
    let keyHandled = false
    let handler = this.keyHandlers[evt.key]
    if (handler) {
      handler = handler.bind(this)
      keyHandled = handler(evt.key, evt)
    }

    if (!keyHandled && evt.key.length === 1) {
      // insert mode works as insert until line is full, then turns into overwrite mode automatically
      // update cell contents
      const cell = getCell(this.screen, this.cursorLocation[0], this.cursorLocation[1])
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
          cellLoc[0] += 1
          if (cellLoc[0] > this.screen.dataset.columns) {
            cellLoc[0] = 1
            cellLoc[1] += 1
          }
          const moveCell = getCell(this.screen, cellLoc[0], cellLoc[1])
          moveCell.innerHTML = this.inputText[idx]
        }
      }

      if (replaceCurrentChar) {
        const pre = (this.cursorInputIndex === 0) ? '' : this.inputText.substring(0, this.cursorInputIndex)
        const post = (this.cursorInputIndex === this.inputText.length - 1) ? '' : this.inputText.substring(this.cursorInputIndex + 1)
        this.inputText = pre + evt.key + post
      }

      if (advanceCursor) {
        this.cursorInputIndex += 1
        this.cursorLocation[0] += 1
        if (this.cursorLocation[0] > this.screen.dataset.columns) {
          this.cursorLocation[0] = 1
          this.cursorLocation[1] += 1
        }
        if (this.cursorInputIndex === this.inputText.length) {
          this.cursorEnd = [...this.cursorLocation]
        }
      }
    }
    console.log('idx', this.cursorInputIndex, '['+this.inputText+']')
    // restart cursor
    this.cursor(true)
  }

  doFuncKey(key, evt) {
    // TODO: nothing for now
  }

  doBackspace(key, evt) {
    // do nothing if at start of command line
    if (this.cursorInputIndex === 0) return

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
      this.cursorLocation[0] -= 1
      if (this.cursorLocation[0] < 1) {
        this.cursorLocation[0] = 1
        this.cursorLocation[1] -= 1
      }
      this.cursorInputIndex -= 1
      if (this.cursorInputIndex === this.inputText.length) {
        this.cursorEnd = [...this.cursorLocation]
      }
    }

    const cell = getCell(this.screen, this.cursorLocation[0], this.cursorLocation[1])
    cell.innerHTML = ''

    if (shiftCells) {
      let cellLoc = [...this.cursorLocation]
      for (let idx = this.cursorInputIndex; idx <= this.inputText.length; idx++) {
        const cell = getCell(this.screen, cellLoc[0], cellLoc[1])
        cell.innerHTML = (idx === this.inputText.length) ? '' : this.inputText[idx]
        if (cell.innerHTML === '') { this.cursorEnd = [...cellLoc] }
        cellLoc[0] += 1
        if (cellLoc[0] > this.screen.dataset.columns) {
          cellLoc[0] = 1
          cellLoc[1] += 1
        }
      }
    }

    return true
  }

  doTab(key, evt) {

  }

  doEnter(key, evt) {

  }

  doArrow(key, evt) {
    if (evt.ctrlKey && key === "ArrowLeft") { // sol
      this.cursorInputIndex = 0
      this.cursorLocation = [...this.cursorStart]
    } else if (evt.ctrlKey && key === "ArrowRight") { // eol
      this.cursorInputIndex = (this.inputText.length === this.maxLength) ? this.maxLength - 1 : this.inputText.length
      this.cursorLocation = [...this.cursorEnd]
    } else if (evt.altKey && key === "ArrowLeft") { // start of word
      if (this.cursorInputIndex > 0) {
        let csrIdx = this.cursorInputIndex
        while (csrIdx > 0) {
          console.log('testing at',csrIdx,'ch',this.inputText[csrIdx])
          if (separatorCharacters.indexOf(this.inputText[csrIdx]) >= 0 && csrIdx < this.cursorInputIndex -1) {
            console.log('found separator')
            csrIdx += 1 // move to start of word
            break
          }
          csrIdx -= 1
        }
        this.cursor(false)
        if (csrIdx === 0) {
          console.log('sol')
          this.cursorInputIndex = 0
          this.cursorLocation = [...this.cursorStart]
        } else {
          for (let idx = this.cursorInputIndex; idx > csrIdx; idx--) {
            console.log('backing up to',idx,'at',this.cursorLocation)
            this.cursorLocation[0] -= 1
            if (this.cursorLocation[0] < 1) {
              this.cursorLocation[0] = 1
              this.cursorLocation[1] -= 1
            }
          }
          this.cursorInputIndex = csrIdx
        }
        this.cursor(true)
      }
    } else if (evt.altKey && key === "ArrowRight") {
    } else if (key === "ArrowLeft") {
      if (this.cursorInputIndex > 0) {
        this.cursorInputIndex -= 1
        this.cursorLocation[0] -= 1
        if (this.cursorLocation[0] < 1) {
          this.cursorLocation[0] = this.screen.dataset.columns
          this.cursorLocation[1] -= 1
        }
      }
    } else if (key === "ArrowRight") {
      if (this.cursorInputIndex < this.inputText.length && this.cursorInputIndex < this.maxLength - 1) {
        this.cursorInputIndex += 1
        this.cursorLocation[0] += 1
        if (this.cursorLocation[0] > this.screen.dataset.columns) {
          this.cursorLocation[0] = 1
          this.cursorLocation[1] += 1
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
