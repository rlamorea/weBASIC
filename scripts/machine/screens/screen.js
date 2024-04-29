// internal constants
let screenGlobals = {
  colors: {
    foreground: 'white',
    background: 'black',
    border: 'black'
  },
  registeredScreens: { }
}

const specialKeyMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
  "block": "&#9608;"
}

export default class Screen {
  constructor(screenName, div, screenType, options) {
    this.screenName = screenName
    this.screenType = screenType || 'generic'
    screenGlobals.registeredScreens[screenName] = 'registered'
    this.div = div
    this.screenSize = [ window.innerWidth, window.innerHeight]
    this.borderSize = [ 0, 0 ]
    this.viewportSize = [ ...this.screenSize ]
    this.cellSize = [ 1, 1 ]
    this.scrollSize = [ ...this.screenSize ]
    this.viewportStart = [ 1, 1 ]
    this.cursorLocation = [ 1, 1 ]
    this.viewportCursorLocation = [ 1, 1 ]
  }

  registeredScreens() { return screenGlobals.registeredScreens }
  screenType() { return this.screenType }

  resetOtherScreenStatus(status = 'rerender') {
    for (const screen in screenGlobals.registeredScreens) {
      if (screen === this.screenName) continue
      screenGlobals.registeredScreens[screen] = status
    }
  }

  setColor(color, value) {
    screenGlobals.color[color] = value
    this.resetOtherScreenStatus()
  }

  getColor(color) { return screenGlobals.color[color] }

  htmlChar(char) { return specialKeyMap[char] || char }

  initialized() { /* do nothing */ }

  activated(active) { /* do nothing */ }

  setViewport(width, height) {
    this.resetOtherScreenStatus()
    this.viewportSize = [ width, height ]
  }

  setScrollSize(width, height) {
    this.scrollSize = [ width, height ]
  }

  scrollBy(xoffset, yoffset) {
    this.viewportStart[0] += xoffset
    this.viewportStart[1] += yoffset

    this.viewportCursorLocation[0] -= xoffset
    this.viewportCursorLocation[1] -= yoffset
  }

  shiftBy(xoffset, yoffset) {
    this.cursorLocation[0] -= xoffset
    this.cursorLocation[1] -= yoffset

    this.viewportStart[0] -= xoffset
    this.viewportStart[1] -= yoffset

    this.viewportCursorLocation[0] -= xoffset
    this.viewportCursorLocation[1] -= yoffset
  }

  clearScreen() {
    this.div.innerHTML = ''
    this.cursorLocation = [ 1, 1 ]
    this.viewportCursorLocation = [ 1, 1 ]
    this.scrollTo(this.cursorLocation)
  }

  checkForViewportScroll() {
    let col = this.viewportCursorLocation[0]
    let row = this.viewportCursorLocation[1]
    let xoffset = 0
    let yoffset = 0
    if (col < 1) {
      xoffset = -col
    } else if (col > this.viewportSize[0]) {
      xoffset = this.viewportSize[0] - col
    }
    if (row < 1) {
      yoffset = -row
    } else if (row > this.viewportSize[1]) {
      yoffset = this.viewportSize[1] - row
    }
    if (xoffset === 0 && yoffset === 0) { return this.viewportCursorLocation } // nothing more to do
    this.scrollBy(xoffset, yoffset)
    return this.viewportCursorLocation
  }

  clearViewport() {
    // no common implementation
  }

  moveTo(position, withinViewport = true) {
    if (withinViewport) {
      this.viewportCursorLocation = [ ...position ]
      this.cursorLocation = [ position[0] + this.viewportStart[0] - 1, position[1] + this.viewportStart[1] - 1 ]
      return this.checkForViewportScroll()
    } else {
      this.cursorLocation = [ ...position ]
      this.viewportCursorLocation = [ position[0] - this.viewportStart[0] + 1, position[1] - this.viewportStart[1] + 1 ]
      return this.cursorLocation
    }
  }

  moveBy(xOffset, yOffset, withinViewport = true) {
    if (withinViewport) {
      const xOffsetYMod = Math.floor(xOffset / this.viewportSize[0])
      xOffset = xOffset - (xOffsetYMod * this.viewportSize[0])
      yOffset += xOffsetYMod
      const xYMod = Math.floor(((this.viewportCursorLocation[0] - 1) + xOffset) / this.viewportSize[0])
      this.viewportCursorLocation[0] = (((this.viewportCursorLocation[0] - 1) + xOffset) % this.viewportSize[0]) + 1
      this.viewportCursorLocation[1] = this.viewportCursorLocation[1] + yOffset + xYMod
      this.cursorLocation = [ this.viewportCursorLocation[0] + this.viewportStart[0] - 1, this.viewportCursorLocation[1] + this.viewportStart[1] - 1 ]
    } else {
      this.cursorLocation = [this.cursorLocation[0] + xOffset, this.cursorLocation[1] + yOffset]
      this.viewportCursorLocation = [this.viewportCursorLocation[0] + xOffset, this.viewportCursorLocation[1] + yOffset]
    }
    return this.checkForViewportScroll()
  }

  draw(position, foreground = true, withinViewport = true) {
    // no common implementation
  }

  home(withinViewport = true) {
    let cursor = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    if (withinViewport) {
      this.viewportCursorLocation = [ 1, 1 ]
      this.cursorLocation = [ ...this.viewportStart ]
    } else {
      this.cursorLocation = [ 1, 1 ]
      this.viewportCursorLocation = [
        this.cursorLocation[0] - this.viewportStart[0] + 1,
        this.cursorLocation[1] - this.viewportStart[1] + 1
      ]
    }
    return cursor
  }

  newline(withinViewport = true) {
    let cursor = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    return this.moveTo([ 1, cursor[1] + 1 ], withinViewport)
  }

  advanceCursor(count = 1, withinViewport = true) {
    let cursor = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    return this.advanceCursorFrom(cursor, count, withinViewport)
  }

  advanceCursorFrom(position, count = 1, withinViewport = true) {
    const maxX = withinViewport ? this.viewportSize[0] : this.scrollSize[0]
    for (let idx = 0; idx < count; idx++) {
      position[0] += 1
      if (position[0] > maxX) {
        position[0] = 1
        position[1] += 1
      }
    }
    return this.moveTo(position, withinViewport)
  }

  displayChar(character, withinViewport = true) {
    let cursor = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    this.displayCharAt(cursor, character, withinViewport)
    this.advanceCursor(1, withinViewport)
  }

  displayCharAt(position, character, withinViewport = true) {
    // no common implementation
  }

  displayString(string, newline = true, withinViewport = true) {
    let cursor = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    return this.displayStringAt(cursor, string, newline, withinViewport)
  }

  displayStringAt(position, string, newline = true, withinViewport = true) {
    position = this.moveTo(position, withinViewport)
    for (const char of string) {
      position = this.displayChar(char, withinViewport)
    }
    if (newline) { position = this.newline() }
    return position
  }
}