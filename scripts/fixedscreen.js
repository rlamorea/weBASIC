// internal constants

const validColumns = [ 160, 120, 80, 40, 20, 10 ]
const validRows = [ 60, 40, 25, 20, 15, 10, 5 ]
const minRows = validRows[validRows.length - 1]

const fontHeightPct = 0.85 // rough estimate of font height in pixels vs specific cell size

const initializedEvent = new Event('initialized')

// internal locals
let referenceCellPx = null

const specialKeyMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export default class FixedScreen {
  constructor(div, requiredColumns = 0, requiredRows = 0) {
    this.referenceCellPx = null
    this.div = div

    this.referenceCellPx = null
    this.sizeScreen(requiredColumns, requiredRows)
  }

  sizeScreen(requiredColumns, requiredRows, refCell) {
    if (!refCell) {
      refCell = document.createElement('div')
      refCell.style.position = 'fixed'
      refCell.style.fontFamily = 'monospace'
      refCell.style.fontSize = '0.25in'
      refCell.innerHTML = 'M'

      document.body.appendChild(refCell)
      setTimeout(() => { this.sizeScreen(requiredColumns, requiredRows, refCell) }, 10)
      return
    } else {
      this.referenceCellPx = [ refCell.offsetWidth, refCell.offsetHeight ]
      refCell.remove()
      this.fitScreen(requiredColumns, requiredRows)
    }
  }

  fitScreen(requiredColumns, requiredRows) {
    const referenceCellRatio = this.referenceCellPx[0] / this.referenceCellPx[1]
    // proceed on
    const screenSize = [ window.innerWidth, window.innerHeight ]
    let cellSize = [ 0, 0 ]

    // standardize required columns/rows
    if (requiredColumns) {
      for (const vcols of validColumns) {
        if (requiredColumns <= vcols) {
          requiredColumns = vcols
          break
        }
      }
    }
    if (requiredRows) {
      for (const vrows of validRows) {
        if (requiredRows <= vrows) {
          requiredRows = vrows
          break
        }
      }
    }

    let columns = 0
    let rows = 0
    if (!requiredColumns && !requiredRows) {
      // find best fit
      for (const valCols of validColumns) {
        cellSize[0] = screenSize[0] / valCols
        if (cellSize[0] >= this.referenceCellPx[0]) { columns = valCols; break }
      }
      cellSize[1] = cellSize[0] / referenceCellRatio
      rows = screenSize[1] / cellSize[1]
      if (rows < minRows) {
        rows = minRows
        cellSize[1] = screenSize[1] / rows
        cellSize[0] = cellSize[1] * referenceCellRatio
        columns = Math.floor(screenSize[0] / cellSize[0])
      } else {
        for (const valRows of validRows) {
          if (rows >= valRows) { rows = valRows; break }
        }
      }
      cellSize = [ Math.floor(cellSize[0]), Math.floor(cellSize[1]) ]
    } else if (!requiredRows) {
      // TODO
    } else if (!requiredColumns) {
      // TODO
    } else {
      // TODO
    }

    this.columns = columns
    this.rows = rows
    this.cellSize = cellSize
    this.screenTextSize = [ columns * cellSize[0], rows * cellSize[1] ]
    this.borderSize = [ (screenSize[0] - this.screenTextSize[0]) / 2, (screenSize[1] - this.screenTextSize[1]) / 2 ]
    console.log(`Screen: ${columns}x${rows}, cell size ${cellSize}, border: ${this.borderSize}`)
    this.fontSize = Math.floor(cellSize[1] * fontHeightPct)
    this.layCells()
  }

  layCells() {
    // wipe the div
    this.div.innerHTML = ''

    // adjust screen size
    this.div.style.width = this.screenTextSize[0] + 'px'
    this.div.style.height = this.screenTextSize[1] + 'px'
    this.div.style.fontSize = this.fontSize + 'px'
    this.displayCursor = [ 1, 1 ]

    // set border
    let borderSizes = []
    if (this.borderSize[0] % 1  > 0) {
      borderSizes[3] = Math.floor(this.borderSize[0])
      borderSizes[1] = borderSizes[3] + 1
    } else {
      borderSizes[1] = borderSizes[3] = this.borderSize[0]
    }
    if (this.borderSize[1] % 1  > 0) {
      borderSizes[2] = Math.floor(this.borderSize[1])
      borderSizes[0] = borderSizes[2] + 1
    } else {
      borderSizes[2] = borderSizes[0] = this.borderSize[1]
    }
    this.div.style.borderStyle = 'solid'
    this.div.style.borderWidth = borderSizes.map((bs) => { return `${bs}px` }).join(' ')
    this.div.style.borderColor = window.getComputedStyle(this.div, null).getPropertyValue('background-color')

    // set up cell style
    let stylesheet = (document.adoptedSyleSheets && document.adoptedSyleSheets.length > 0) ? document.adoptedSyleSheets[0] : new CSSStyleSheet()
    stylesheet.replace(`#${this.div.id} .cell { width: ${this.cellSize[0]}px; height: ${this.cellSize[1]}px; line-height: ${this.cellSize[1]}px; }`)
    document.adoptedStyleSheets = [ stylesheet ]

    // insert cells
    for (let row = 1; row <= this.rows; row++) {
      for (let column = 1; column <= this.columns; column++) {
        const cell = document.createElement('span')
        cell.classList.add('cell')
        cell.dataset.column = column
        cell.dataset.row = row
        this.div.appendChild(cell)
      }
    }

    this.div.dispatchEvent(initializedEvent)
  }

  linesRequired(x, y, length) {
    return x + Math.ceil((length + (x - 1)) / this.columns)
  }

  linesRequiredFromCursor(length) {
    return this.linesRequired(this.displayCursor[0], this.displayCursor[1], length)
  }

  ensureLines(lines) {
    const cy = this.displayCursor[1] + lines
    if (cy > this.rows) {
      this.scrollScreen(0, this.rows - cy)
    }
  }

  newline() {
    this.displayCursor[0] = 1
    this.displayCursor[1] += 1
    if (this.displayCursor[1] > this.rows) {
      this.scrollScreen(0, -1)
    }
  }

  htmlChar(char) {
    return specialKeyMap[char] || char
  }

  moveCursorDelta(xoffset, yoffset) {
    let cx = this.displayCursor[0] + xoffset
    let cy = this.displayCursor[1] + yoffset
    if (cx < 1) {
      cx = this.columns
      cy -= 1
    } else if (cx > this.columns) {
      cx = 1
      cy += 1
    }
    this.displayCursor[0] = cx
    this.displayCursor[1] = cy
    if (cy < 1) {
      this.scrollScreen(0, -cy)
    } else if (cy > this.rows) {
      this.scrollScreen(0, this.rows - cy)
    }
  }

  displayStringAtCursor(string, newline = true) {
    this.displayString(this.displayCursor[0], this.displayCursor[1], string, newline)
  }

  displayString(x, y, string, newline = true) {
    if (x < 1) { x = 1 }
    if (y < 1) { y = 1 }
    const yoffset = this.rows - (y + this.linesRequired(x, y, string.length))
    if (yoffset < 0) {
      const offset = this.scrollScreen(0, yoffset)
      x += offset[0]
      y += offset[1]
    }

    let column = x
    let row = y
    for (const char of string) {
      if (column > this.columns) { column = 1; row += 1 }
      if (row > this.rows) break; // nothing more to do
      const cell = this.getCell(column, row)
      cell.innerHTML = this.htmlChar(char)
      column += 1
    }
    this.displayCursor[0] = column
    this.displayCursor[1] = row
    if (newline) { this.newline() }
  }

  getCell(x, y) {
    const cell = this.div.querySelector(`.cell[data-column="${x}"][data-row="${y}"]`)
    if (!cell) {
      debugger
    }
    return cell
  }

  scrollScreen(xoffset, yoffset) {
    // copy existing contents that need to be moved
    let existingContent = []
    let offsetRowStart = Math.max(0, -yoffset + 1)
    let offsetRowEnd = Math.min(this.rows, this.rows - yoffset + 1)
    let offsetColStart = Math.max(0, -xoffset + 1)
    let offsetColEnd = Math.min(this.columns, this.columns - xoffset + 1)

    for (let row = offsetRowStart; row <= offsetRowEnd; row++) {
      for (let column = offsetColStart; column <= offsetColEnd; column++) {
        const cell = this.getCell(column, row)
        existingContent.push(cell.innerHTML)
      }
    }

    // clear screen contents
    for (let row = 1; row <= this.rows; row++) {
      for (let column = 1; column <= this.columns; column++) {
        const cell = this.getCell(column, row)
        cell.innerHTML = ''
      }
    }

    // insert existing contents back starting at new origin]
    offsetRowStart = Math.max(1, offsetRowStart + yoffset)
    offsetRowEnd = Math.min(this.rows, offsetRowEnd + yoffset)
    offsetColStart = Math.max(1, offsetColStart + yoffset)
    offsetColEnd = Math.min(this.columns, offsetColEnd + xoffset)
    for (let row = offsetRowStart; row <= offsetRowEnd; row++) {
      for (let column = offsetColStart; column <= offsetColEnd; column++) {
        //console.log(column, row)
        const cell = this.getCell(column, row)
        cell.innerHTML = existingContent.shift()
      }
    }

    this.displayCursor[0] += xoffset
    this.displayCursor[1] += yoffset

    return [ xoffset, yoffset ]
  }
}
