import Screen from './screen.js'

const validColumns = [ 160, 120, 80, 40, 20, 10 ]
const validRows = [ 60, 40, 25, 20, 15, 10, 5 ]
const minRows = validRows[validRows.length - 1]

const fontHeightPct = 0.85 // rough estimate of font height in pixels vs specific cell size

let fixedScreenGlobals = {
  columns: 0,
  rows: 0,
  registeredScreens: []
}

// internal locals
let computingReference = false
let referenceCellPx = null

export default class CharGridScreen extends Screen {
  constructor(screenName, div, machine, options) {
    options = options || {}
    super(screenName, div, 'charGrid-fixed', options)
    this.machine = machine
    this.hasBorder = ('hasBorder' in options) ? options.hasBorder : true
    this.scrolling = options.scrolling
    this.panelSettings = options.panel
    fixedScreenGlobals.columns = options.columns || fixedScreenGlobals.columns
    fixedScreenGlobals.rows = options.rows || fixedScreenGlobals.rows
    this.setViewport(fixedScreenGlobals.columns, fixedScreenGlobals.rows, options.refCell) // for testing
  }

  setViewport(width, height, refCell) {
    if (referenceCellPx) {
      this.fitScreen(width, height)
    } else if (!refCell && computingReference) {
      setTimeout( () => { this.setViewport(width, height) })
    } else if (!refCell) {
      computingReference = true
      refCell = document.createElement('div')
      refCell.style.position = 'fixed'
      refCell.style.fontFamily = 'monospace'
      refCell.style.fontSize = '0.25in'
      refCell.innerHTML = 'M'

      document.body.appendChild(refCell)
      setTimeout(() => { this.setViewport(width, height, refCell) }, 10)
    } else {
      referenceCellPx = [refCell.offsetWidth, refCell.offsetHeight]
      computingReference = false
      refCell.remove()
      this.fitScreen(width, height)
    }
  }

  fitScreen(width, height) {
    const referenceCellRatio = referenceCellPx[0] / referenceCellPx[1]
    // proceed on
    this.cellSize = [0, 0]

    // standardize required columns/rows
    if (width) {
      for (const vcols of validColumns) {
        if (width >= vcols) {
          width = vcols
          break
        }
      }
    }
    if (height) {
      for (const vrows of validRows) {
        if (height >= vrows) {
          height = vrows
          break
        }
      }
    }

    let columns = 0
    let rows = 0
    if (width && height && fixedScreenGlobals.cellSize) {
      columns = fixedScreenGlobals.columns
      rows = fixedScreenGlobals.rows
      this.cellSize = [ ...fixedScreenGlobals.cellSize ]
    } else if (!width && !height) {
      // find best fit
      for (const valCols of validColumns) {
        this.cellSize[0] = this.screenSize[0] / valCols
        if (this.cellSize[0] >= referenceCellPx[0]) {
          columns = valCols;
          break
        }
      }
      this.cellSize[1] = this.cellSize[0] / referenceCellRatio
      rows = this.screenSize[1] / this.cellSize[1]
      if (rows < minRows) {
        rows = minRows
        this.cellSize[1] = this.screenSize[1] / rows
        this.cellSize[0] = this.cellSize[1] * referenceCellRatio
        columns = Math.floor(this.screenSize[0] / this.cellSize[0])
      } else {
        for (const valRows of validRows) {
          if (rows >= valRows) {
            rows = valRows;
            break
          }
        }
      }
      this.cellSize = [Math.floor(this.cellSize[0]), Math.floor(this.cellSize[1])]
    } else if (!width) {
      rows = height
      this.cellSize[1] = this.screenSize[1] / height
      this.cellSize[0] = this.cellSize[1] * referenceCellRatio
      columns = Math.floor(this.screenSize[0] / this.cellSize[0])
      for (const valCols of validColumns) {
        if(columns >= valCols) {
          columns = valCols
          break
        }
      }
      this.cellSize = [Math.floor(this.cellSize[0]), Math.floor(this.cellSize[1])]
    } else if (!height) {
      columns = width
      this.cellSize[0] = this.screenSize[0] / width
      this.cellSize[1] = this.cellSize[0] / referenceCellRatio
      rows = Math.floor(this.screenSize[1] / this.cellSize[1])
      for (const valRows of validRows) {
        if (rows >= valRows) {
          rows = valRows
          break
        }
      }
      this.cellSize = [Math.floor(this.cellSize[0]), Math.floor(this.cellSize[1])]
    } else {
      columns = width
      rows = height
      this.cellSize[0] = this.screenSize[0] / width
      this.cellSize[1] = this.screenSize[1] / height
      let heightByWidth = this.cellSize[0] / referenceCellRatio
      if (heightByWidth <= this.cellSize[1]) {
        this.cellSize[1] = heightByWidth
      } else {
        this.cellSize[0] = this.cellSize[1] * referenceCellRatio
      }
      this.cellSize = [Math.floor(this.cellSize[0]), Math.floor(this.cellSize[1])]
    }

    fixedScreenGlobals.columns = columns
    fixedScreenGlobals.rows = rows
    fixedScreenGlobals.cellSize = [ ...this.cellSize ]
    this.viewportSize = [ columns, rows ]
    this.scrollSize = this.viewportSize
    this.viewportStart = [ 1, 1 ]
    fixedScreenGlobals.screenTextSize = [columns * this.cellSize[0], rows * this.cellSize[1]]
    this.borderSize = [(this.screenSize[0] - fixedScreenGlobals.screenTextSize[0]) / 2, (this.screenSize[1] - fixedScreenGlobals.screenTextSize[1]) / 2]

    if (this.panelSettings) {
      this.panelSettings.borderOffset = {}
      if (this.panelSettings.location === 'top' || this.panelSettings.location === 'bottom') {
        this.viewportSize[1] = this.panelSettings.rows
        this.panelSettings.height = this.panelSettings.rows * this.cellSize[1]
        this.panelSettings.borderOffset[this.panelSettings.location] = (rows - this.panelSettings.rows) * this.cellSize[1]
      } else if (this.panelSettings.location === 'left' || this.panelSettings.location === 'right') {
        this.viewportSize[0] = this.panelSettings.columns
        this.panelSettings.width = this.panelSettings.columns * this.cellSize[0]
        this.panelSettings.borderOffset[this.panelSettings.location] = (columns - this.panelSettings.colunns) * this.cellSize[0]
      }
    }

    console.log(`Screen: ${columns}x${rows}, cell size ${this.cellSize}, border: ${this.borderSize}`)
    fixedScreenGlobals.fontSize = Math.floor(this.cellSize[1] * fontHeightPct)
    this.fontSize = fixedScreenGlobals.fontSize

    if (!fixedScreenGlobals.letterSpacing) {
      const refText = document.createElement('div')
      refText.style.position = 'fixed'
      refText.style.fontFamily = 'monospace'
      refText.style.fontSize = `${this.fontSize}px`
      refText.innerHTML = '0123456789'
      document.body.appendChild(refText)

      const charWidth = refText.offsetWidth / 10
      fixedScreenGlobals.letterSpacing = this.cellSize[0] - charWidth

      refText.remove()
    }
    this.letterSpacing = fixedScreenGlobals.letterSpacing

    this.layCells()
  }

  layCells() {
    // wipe the div
    this.div.innerHTML = ''

    // adjust screen size
    this.div.style.width = (this?.panelSettings?.width || fixedScreenGlobals.screenTextSize[0]) + 'px'
    this.div.style.height = (this?.panelSettings?.height || fixedScreenGlobals.screenTextSize[1]) + 'px'
    this.div.style.fontSize = fixedScreenGlobals.fontSize + 'px'
    this.cursorLocation = [ 1, 1 ]
    this.viewportCursorLocation = [ 1, 1 ]

    // set border
    if (this.hasBorder) {
      let borderSizes = [ 0, 0, 0, 0 ]
      if (this.borderSize[0] % 1 > 0) {
        borderSizes[3] = Math.floor(this.borderSize[0])
        borderSizes[1] = borderSizes[3] + 1
      } else {
        borderSizes[1] = borderSizes[3] = this.borderSize[0]
      }
      if (this.borderSize[1] % 1 > 0) {
        borderSizes[2] = Math.floor(this.borderSize[1])
        borderSizes[0] = borderSizes[2] + 1
      } else {
        borderSizes[2] = borderSizes[0] = this.borderSize[1]
      }
      // note border opposite the panel location is offset
      borderSizes[2] += this.panelSettings?.borderOffset?.top || 0
      borderSizes[3] += this.panelSettings?.borderOffset?.right || 0
      borderSizes[0] += this.panelSettings?.borderOffset?.bottom || 0
      borderSizes[1] += this.panelSettings?.borderOffset?.left || 0
      this.div.style.borderStyle = 'solid'
      this.div.style.borderWidth = borderSizes.map((bs) => {
        return `${bs}px`
      }).join(' ')
      this.div.style.borderColor = window.getComputedStyle(this.div, null).getPropertyValue('background-color')
    }

    // set up cell style
    let stylesheet = (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0) ? document.adoptedStyleSheets[0] : new CSSStyleSheet()
    stylesheet.insertRule(`#${this.div.id} .cell { width: ${fixedScreenGlobals.cellSize[0]}px; height: ${fixedScreenGlobals.cellSize[1]}px; line-height: ${fixedScreenGlobals.cellSize[1]}px; }`)
    document.adoptedStyleSheets = [stylesheet]

    // insert cells
    for (let row = 1; row <= this.scrollSize[1]; row++) {
      for (let column = 1; column <= this.scrollSize[0]; column++) {
        const cell = document.createElement('span')
        cell.classList.add('cell')
        cell.dataset.column = column
        cell.dataset.row = row
        this.div.appendChild(cell)
      }
    }

    this.registeredScreens()[this.screenName] = 'rendered'
    this.initialized()
  }

  getCell(position) {
    const cell = this.div.querySelector(`.cell[data-column="${position[0]}"][data-row="${position[1]}"]`)
    if (!cell) { debugger } // temporary to help identify cases where the code messes up
    return cell
  }

  setScrollSize(width, height) {
    if (!this.scrolling) return
    super.setScrollSize(width, height)
  }

  debugDumpScreen() {
    const cells = this.div.querySelectorAll('.cell')
    for (let r = 1; r <= this.viewportSize[1]; r++) {
      let d = `${r < 10 ? ' ' : ''}${r} [`
      for (let c = 1; c <= this.viewportSize[0]; c++) {
        const cc = cells[(r - 1)*this.viewportSize[0] + (c-1)].innerHTML
        d += (cc === '') ? '.' : cc
      }
      d += ']'
      console.log(d)
    }
  }

  scrollBy(xoffset, yoffset) {
    if (this.scrolling) {
      super.scrollBy(xoffset, yoffset)
      // TODO: if viewport moves off screen, then do a shift
      return
    }

    // copy existing contents that need to be moved
    let existingContent = []
    let offsetRowStart = -yoffset + 1
    let offsetRowEnd = this.viewportSize[1] - yoffset
    let offsetColStart = -xoffset + 1
    let offsetColEnd = this.viewportSize[0] - xoffset
    let offsetRowStartMax = Math.max(1, offsetRowStart)
    let offsetRowEndMin = Math.min(this.viewportSize[1], offsetRowEnd)
    let offsetColStartMax = Math.max(1, offsetColStart)
    let offsetColEndMin = Math.min(this.viewportSize[0], offsetColEnd)

    for (let row = offsetRowStartMax; row <= offsetRowEndMin; row++) {
      for (let column = offsetColStartMax; column <= offsetColEndMin; column++) {
        const cell = this.getCell([ column, row ])
        existingContent.push(cell.innerHTML)
      }
    }

    // clear screen contents
    for (let row = 1; row <= this.viewportSize[1]; row++) {
      for (let column = 1; column <= this.viewportSize[0]; column++) {
        const cell = this.getCell([ column, row ])
        cell.innerHTML = ''
      }
    }

    // insert existing contents back starting at new origin]
    offsetRowStartMax = Math.max(1, offsetRowStartMax + yoffset)
    offsetRowEndMin = Math.min(this.viewportSize[1], offsetRowEndMin + yoffset)
    offsetColStartMax = Math.max(1, offsetColStartMax + xoffset)
    offsetColEndMin = Math.min(this.viewportSize[0], offsetColEndMin + xoffset)
    for (let row = offsetRowStartMax; row <= offsetRowEndMin; row++) {
      for (let column = offsetColStartMax; column <= offsetColEndMin; column++) {
        //console.log(column, row)
        const cell = this.getCell([ column, row ])
        cell.innerHTML = existingContent.shift()
      }
    }

    this.viewportCursorLocation[0] += xoffset
    this.viewportCursorLocation[1] += yoffset
    this.cursorLocation = [ ...this.viewportCursorLocation ]

    return [xoffset, yoffset]
  }

  shiftBy(xoffset, yoffset) {
    if (!this.scrolling) return
    super.shiftBy(xoffset, yoffset)
    // TODO: once we get scrolling working
  }

  clearScreen() {
    // NOTE: total override -- no super call
    this.div.querySelectorAll('.cell').each((c) => {
      c.innerHTML = ''
      c.className = 'cell' // remove all other classes
    })
    this.viewportCursorLocation = [ 1, 1 ]
    this.cursorLocation = [ this.viewportCursorLocation[0] - this.viewportStart[0] + 1, this.viewportCursorLocation[1] - this.viewportStart[1] + 1 ]
    if (this.scrolling) {
      this.scrollTo(this.cursorLocation)
    }
  }

  clearViewport() {
    for (let row = 0; row < this.viewportSize[1]; row++) {
      for (let col = 0; col < this.viewportSize[0]; col++) {
        const cell = this.getCell([ this.viewportStart[0] + col, this.viewportStart[1] + row ])
        cell.innerHTML = ''
        cell.className = 'cell'
      }
    }
    this.viewportCursorLocation = [ 1, 1 ]
    this.cursorLocation = [ this.viewportCursorLocation[0] - this.viewportStart[0] + 1, this.viewportCursorLocation[1] - this.viewportStart[1] + 1 ]
  }

  draw(position, foreground = true, withinViewport) {
    super.moveTo(position, withinViewport)
    const cell = this.getCell(this.cursorLocation)
    cell.innerHTML = this.htmlChar('block')
    return withinViewport ? this.viewportCursorLocation : this.cursorLocation
  }

  home(withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    return super.home(withinViewport)
  }

  newline(withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    return super.newline(withinViewport)
  }

  advanceCursor(count = 1, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    super.advanceCursor(count, withinViewport)
  }

  advanceCursorFrom(position, count = 1, withinViewport = true) {
    withinViewport = (this.scrolling) ? viewportWrap : true
    return super.advanceCursorFrom(position, count, withinViewport)
  }

  displayChar(character, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    super.displayChar(character, withinViewport)
  }

  displayCharAt(position, character, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    position = super.moveTo(position, withinViewport)
    const cell = this.getCell(this.cursorLocation)
    cell.innerHTML = this.htmlChar(character)
    return position
  }

  displayString(string, newline = true, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    super.displayString(string, newline, withinViewport)
  }

  displayStringAt(position, string, newline = true, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    return super.displayStringAt(position, string, newline, withinViewport)
  }

  linesRequiredFrom(startPosition, length, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    const columns = withinViewport ? this.viewportSize[0] : this.scrollSize[0]
    return Math.ceil( (length + (startPosition[0] - 1)) / columns )
  }

  linesRequired(length, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    const startPosition = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    return this.linesRequiredFrom(startPosition, length, withinViewport)
  }

  ensureLines(lines, withinViewport = true) {
    withinViewport = (this.scrolling) ? withinViewport : true
    const cursorLoc = withinViewport ? this.viewportCursorLocation : this.cursorLocation
    const screenSize = withinViewport ? this.viewportSize : this.scrollSize
    let yoffset = screenSize[1] - (cursorLoc[1] + lines)
    if (cursorLoc[0] === 1) { yoffset += 1 }
    if (yoffset < 0) {
      if (withinViewport) {
        this.scrollBy(0, yoffset)
      } else {
        this.shiftBy(0, yoffset)
      }
    }
  }
}