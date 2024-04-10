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

// functions
function initScreen(div, requiredLines, handlerInstance, refCell) {
  if (referenceCellPx === null) {
    refCell = document.createElement('div')
    refCell.style.position = 'fixed'
    refCell.style.fontFamily = 'monospace'
    refCell.style.fontSize = '0.25in'
    refCell.innerHTML = 'M'

    document.body.appendChild(refCell)
    referenceCellPx = []
    setTimeout(() => { initScreen(div, requiredLines, handlerInstance, refCell) }, 10)
    return
  }
  if (referenceCellPx.length === 0) {
    referenceCellPx = [ refCell.offsetWidth, refCell.offsetHeight ]
    refCell.remove()
  }
  const referenceCellRatio = referenceCellPx[0] / referenceCellPx[1]
  // proceed on
  const screenSize = [ window.innerWidth, window.innerHeight ]
  let cellSize = [ 0, 0 ]
  let columns = 0
  for (const valCols of validColumns) {
    cellSize[0] = screenSize[0] / valCols
    if (cellSize[0] >= referenceCellPx[0]) { columns = valCols; break }
  }
  cellSize[1] = cellSize[0] / referenceCellRatio
  // TODO: deal with required lines case (panels)
  let rows = screenSize[1] / cellSize[1]
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

  const screenTextSize = [ columns * cellSize[0], rows * cellSize[1] ]
  const borderSize = [ (screenSize[0] - screenTextSize[0]) / 2, (screenSize[1] - screenTextSize[1]) / 2 ]
  console.log(`Screen: ${columns}x${rows}, cell size ${cellSize}, border: ${borderSize}`)
  layCells(div, handlerInstance, { screenSize: screenTextSize, screenGrid: [ columns, rows ], cellSize, borderSize, fontSize: Math.floor(cellSize[1] * fontHeightPct) })
}

function layCells(div, handlerInstance, dimensions) {
  // adjust screen size
  div.style.width = dimensions.screenSize[0] + 'px'
  div.style.height = dimensions.screenSize[1] + 'px'
  div.style.fontSize = dimensions.fontSize + 'px'
  div.dataset.columns = dimensions.screenGrid[0]
  div.dataset.rows = dimensions.screenGrid[1]
  div.dataset.fontHeight = dimensions.fontSize
  div.screenManager = this

  // set border
  let borderSizes = []
  if (dimensions.borderSize[0] % 1  > 0) {
    borderSizes[3] = Math.floor(dimensions.borderSize[0])
    borderSizes[1] = borderSizes[3] + 1
  } else {
    borderSizes[1] = borderSizes[3] = dimensions.borderSize[0]
  }
  if (dimensions.borderSize[1] % 1  > 0) {
    borderSizes[2] = Math.floor(dimensions.borderSize[1])
    borderSizes[0] = borderSizes[2] + 1
  } else {
    borderSizes[2] = borderSizes[0] = dimensions.borderSize[1]
  }
  div.style.borderStyle = 'solid'
  div.style.borderWidth = borderSizes.map((bs) => { return `${bs}px` }).join(' ')
  div.style.borderColor = window.getComputedStyle(div, null).getPropertyValue('background-color')

  // set up cell style
  let stylesheet = (document.adoptedSyleSheets && document.adoptedSyleSheets.length > 0) ? document.adoptedSyleSheets[0] : new CSSStyleSheet()
  stylesheet.replace(`#${div.id} .cell { width: ${dimensions.cellSize[0]}px; height: ${dimensions.cellSize[1]}px; line-height: ${dimensions.cellSize[1]}px; }`)
  document.adoptedStyleSheets = [ stylesheet ]

  // insert cells
  for (let row = 1; row <= dimensions.screenGrid[1]; row++) {
    for (let column = 1; column <= dimensions.screenGrid[0]; column++) {
      const cell = document.createElement('span')
      cell.classList.add('cell')
      cell.dataset.column = column
      cell.dataset.row = row
      div.appendChild(cell)
    }
  }

  div.screenHandler = handlerInstance
  div.dispatchEvent(initializedEvent)
}

function linesRequired(div, x, y, length) {
  return x + Math.ceil((length + (x - 1)) / div.dataset.columns)
}

function htmlChar(char) {
  return specialKeyMap[char] || char
}

function displayString(div, x, y, string) {
  if (x < 1) { x = 1 }
  if (y < 1) { y = 1 }
  const yoffset = div.dataset.rows - (y + linesRequired(div, x, y, string.length))
  if (yoffset < 0) {
    const offset = scrollScreen(div, 0, yoffset)
    x += offset[0]
    y += offset[1]
  }

  let column = x
  let row = y
  for (const char of string) {
    if (column > div.dataset.columns) { column = 1; row += 1 }
    if (row > div.dataset.rows) break; // nothing more to do
    const cell = getCell(div, column, row)
    cell.innerHTML = htmlChar(char)
    column += 1
  }
}

function getCell(div, x, y) {
  const cell = div.querySelector(`.cell[data-column="${x}"][data-row="${y}"]`)
  if (!cell) {
    debugger
  }
  return cell
}

function scrollScreen(div, xoffset, yoffset) {
  // copy existing contents that need to be moved
  let existingContent = []
  let offsetRowStart = Math.max(0, -yoffset + 1)
  let offsetRowEnd = Math.min(div.dataset.rows, div.dataset.rows - yoffset + 1)
  let offsetColStart = Math.max(0, -xoffset + 1)
  let offsetColEnd = Math.min(div.dataset.columns, div.dataset.columns - xoffset + 1)

  for (let row = offsetRowStart; row <= offsetRowEnd; row++) {
    for (let column = offsetColStart; column <= offsetColEnd; column++) {
      const cell = getCell(div, column, row)
      existingContent.push(cell.innerHTML)
    }
  }

  // clear screen contents
  for (let row = 1; row <= div.dataset.rows; row++) {
    for (let column = 1; column <= div.dataset.columns; column++) {
      const cell = getCell(div, column, row)
      cell.innerHTML = ''
    }
  }

  // insert existing contents back starting at new origin]
  offsetRowStart = Math.max(1, offsetRowStart + yoffset)
  offsetRowEnd = Math.min(div.dataset.rows, offsetRowEnd + yoffset)
  offsetColStart = Math.max(1, offsetColStart + yoffset)
  offsetColEnd = Math.min(div.dataset.columns, offsetColEnd + xoffset)
  for (let row = offsetRowStart; row <= offsetRowEnd; row++) {
    for (let column = offsetColStart; column <= offsetColEnd; column++) {
      //console.log(column, row)
      const cell = getCell(div, column, row)
      cell.innerHTML = existingContent.shift()
    }
  }

  div.dispatchEvent(new CustomEvent('scrolled', { detail: { xoffset, yoffset } }))
  return [ xoffset, yoffset ]
}

export {
  initScreen,
  linesRequired,
  displayString,
  getCell,
  htmlChar,
  scrollScreen
}
