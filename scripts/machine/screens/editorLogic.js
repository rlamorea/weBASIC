import { ErrorCodes } from "../../interpreter/errors.js"

function processLineActions(codeLines, editedScreenLine, machine, editorContents) {
  const lexifier = machine.execution.interpreter.lexifier // UGH!

  if (!Array.isArray(codeLines)) { codeLines = [ codeLines ] }
  let execLines = []
  let deleteLines = {}
  let modLines = {}
  // if we aren't inserting lines from outside, we'll find them when processing editor lines
  let lastModifiedLineNumber = -1
  for (let codeLine of codeLines) {
    const { cleanTokens, lineNumber: lineNumberToken, emptyLine } = lexifier.identifyCleanTokens(codeLine)
    if (!lineNumberToken) {
      codeLine = lexifier.cleanCodeLine(codeLine, cleanTokens)
      execLines.push({ codeLine, compareTo: codeLine.toUpperCase() })
    } else {
      const lineNumber = parseInt(lineNumberToken.token)
      if (lineNumber > lastModifiedLineNumber) { lastModifiedLineNumber = lineNumber }
      const { lineIndex, existing } = machine.execution.indexForLineNumber(machine.runCodespace, lineNumber)
      if (emptyLine) {
        machine.execution.deleteCodeLine(machine.runCodespace, lineNumber)
        deleteLines[lineNumber] = lineNumber
      } else {
        codeLine = lexifier.cleanCodeLine(codeLine, cleanTokens)
        let error = null
        const result = machine.execution.addCodeLine(machine.runCodespace, -1, codeLine)
        if (result.error) { error = result }
        modLines[lineNumber] = { lineNumber, codeLine, existing, error }
      }
    }
  }

  let editorLines = editorContents.split('\n')
  if (editorLines[editorLines.length - 1] === '') { editorLines.pop() }
  let actions = []

  let screenLine = 1
  let editorScreenLine = 0
  let editorLinesInScreenOrder = []
  let editorLineNumbers = []
  // clean up editor lines

  // pass 1 - build line array with line number and screen line - store blanks
  let lastLineNumber = -1
  let blankCount = 0
  let blankLinesAfter = {}
  let execInsertIdx = 0
  for (let editorLine of editorLines) {
    editorScreenLine += 1 // this tracks original line vs. adjusted line
    editorLine = editorLine.trim()
    if (editorLine === '') {
      blankCount += 1
      screenLine += 1
      continue // we'll cut these
    } else if (blankCount > 0) {
      if (lastLineNumber >= 0) {
        blankLinesAfter[lastLineNumber] = { lineNumber: lastLineNumber, screenLine: screenLine, count: blankCount }
      }
      // now erase these lines
      actions.push({ action: 'clearLine', screenLine: screenLine - blankCount, endScreenLine: screenLine - 1 })
      screenLine -= blankCount // clearing means we'll reset the subsequent screen lines
      blankCount = 0
    }
    let editorLineNumberCapture = editorLine.match(/^(\d+)/)
    let lineNumber = null
    if (editorLineNumberCapture) {
      lineNumber = parseInt(editorLineNumberCapture[1])
      lastLineNumber = lineNumber
    }
    // no line number, so exec line to be dealt with later
    if (lineNumber === null) {
      actions.push({ action: 'clearLine', screenLine })
      const compareTo = editorLine.trim().toUpperCase()
      let foundExecLine = false
      for (const execLine of execLines) {
        if (compareTo === execLine.compareTo) {
          foundExecLine = true
          break
        }
      }
      if (!foundExecLine) {
        const { cleanTokens} = lexifier.identifyCleanTokens(editorLine)
        editorLine = lexifier.cleanCodeLine(editorLine, cleanTokens)
        execLines.splice(execInsertIdx, 0, { codeLine: editorLine, compareTo })
        execInsertIdx += 1
      }
      continue // NOTE: screen line not incremented to account for deletion
    }
    const restOfLine = editorLine.substring(editorLineNumberCapture.length).trim()
    // empty line -- delete line
    if (restOfLine === '') {
      actions.push({ action: 'clearLine', screenLine })
      continue // NOTE: screen line not incremented to account for deletion
    }
    // check to see if we've got a deleteLine to override existing
    if (deleteLines[lineNumber]) {
      actions.push({ action: 'clearLine', screenLine})
      continue // NOTE: screen line not incremented to account for deletion
    }
    // see if we've got any duplicates of this line
    const existingLineIndex = editorLineNumbers.indexOf(lineNumber)
    if (existingLineIndex >= 0) {
      // erase that line
      actions.push({ action: 'clearLine', screenLine: editorLinesInScreenOrder[existingLineIndex].screenLine })
      screenLine -= 1 // account for deletion
      editorLinesInScreenOrder.splice(existingLineIndex, 1)
      editorLineNumbers.splice(existingLineIndex, 1)
    }
    // see if we've got a line to replace this one
    if (modLines[lineNumber]) {
      actions.push({
        action: 'replaceLine', screenLine,
        value: modLines[lineNumber].codeLine, error: modLines[lineNumber].error
      })
      editorLine = modLines[lineNumber].codeLine
    }
    editorLinesInScreenOrder.push({ line: editorLine, screenLine, lineNumber })
    editorLineNumbers.push(lineNumber)
    // preserve line in place and proceed
    screenLine += 1
  }

  // pass 2 - get editor lines in order -- this is a block delete/insert strategy
  editorLineNumbers.sort((a, b) => a - b)

  let firstUnorderedIdx = -1
  let firstUnorderedScreenLine = -1
  let allLinesOrdered = true
  for (let idx = 0; idx < editorLineNumbers.length; idx++) {
    if (editorLinesInScreenOrder[idx].lineNumber !== editorLineNumbers[idx]) {
      firstUnorderedIdx = idx
      firstUnorderedScreenLine = editorLinesInScreenOrder[idx].screenLine
      allLinesOrdered = false
      break
    }
  }
  if (!allLinesOrdered) {
    let lastUnorderedIdx = -1
    for (let idx = editorLineNumbers.length - 1; idx >= 0; idx--) {
      if (editorLinesInScreenOrder[idx].lineNumber !== editorLineNumbers[idx]) {
        lastUnorderedIdx = idx
        break
      }
    }

    let choppedLines = editorLinesInScreenOrder.splice(firstUnorderedIdx, lastUnorderedIdx - firstUnorderedIdx + 1)

    actions.push({
      action: 'clearLine',
      screenLine: firstUnorderedScreenLine,
      endScreenLine: firstUnorderedScreenLine + choppedLines.length - 1,
    })

    choppedLines.sort((a, b) => a.lineNumber - b.lineNumber)
    actions.push({
      action: 'insertLine',
      screenLine: firstUnorderedScreenLine,
      value: choppedLines.map((x) => x.line).join('\n')
    })
    editorLinesInScreenOrder.splice(firstUnorderedIdx, 0, ...choppedLines)
    editorLineNumbers = editorLinesInScreenOrder.map((x) => x.lineNumber)
  }

  // editor lines should now be cleaned and sorted
  // pass 3 - time to insert missing lines from memory or insertion (note: lines already inserted into code)
  let linesToInsertOrMatch = []
  for (const codeLineNumber of machine.runCodespace.lineNumbers) {
    linesToInsertOrMatch.push({
      lineNumber: codeLineNumber,
      line: machine.runCodespace.codeLines[codeLineNumber].text,
      error: machine.runCodespace.codeLines[codeLineNumber].error
    })
  }
  let cursorScreenLine = -1
  let cursorLineNumber = -1
  screenLine = 1
  let lastLineUmber = null
  for (const line of editorLinesInScreenOrder) {
    const lineNumber = line.lineNumber
    // check for code lines before
    while (linesToInsertOrMatch.length > 0 && linesToInsertOrMatch[0].lineNumber < lineNumber) {
      const lineToInsert = linesToInsertOrMatch.shift()
      actions.push({
        action: 'insertLine',
        screenLine: screenLine,
        value: lineToInsert.line,
        error: lineToInsert.error
      })
      if (lineToInsert.lineNumber === lastModifiedLineNumber) {
        cursorScreenLine = screenLine
        cursorLineNumber = lineToInsert.lineNumber
      }
      if (lineToInsert.lineNumber > lastModifiedLineNumber && cursorScreenLine < 0) {
        cursorScreenLine = screenLine - 1
        cursorLineNumber = lastLineNumber
      }
      screenLine += 1 // account for insert
      lastLineNumber = lineToInsert.lineNumber
    }
    if (lineNumber > lastModifiedLineNumber && cursorScreenLine < 0) {
      cursorScreenLine = screenLine - 1
      cursorLineNumber = lastLineNumber
    }
    if (linesToInsertOrMatch.length > 0 && linesToInsertOrMatch[0].lineNumber === lineNumber) {
      linesToInsertOrMatch.shift() // done with this one
      // NOTE: not replacing text as this should already be done by pass 2
      if (lineNumber === lastModifiedLineNumber) {
        cursorScreenLine = screenLine
        cursorLineNumber = lineNumber
      }
    } else {
      actions.push({ action: 'clearLine', screenLine: screenLine })
      screenLine -= 1 // account for delete
    }
    screenLine += 1
    lastLineNumber = lineNumber
  }
  while (linesToInsertOrMatch.length > 0) {
    const lineToInsert = linesToInsertOrMatch.shift()
    actions.push({
      action: 'insertLine',
      screenLine: screenLine,
      value: lineToInsert.line,
      error: lineToInsert.error
    })
    screenLine += 1
  }

  // see if the cursor line is within what was a blank block)
  if (cursorLineNumber >= 0) {
    const { lineIndex, lineNumber } = machine.execution.indexForLineNumber(machine.runCodespace, cursorLineNumber, 'before')
    const blankBlock = blankLinesAfter[lineNumber]
    if (blankBlock) {
      actions.push({
        action: 'insertLine',
        screenLine: cursorScreenLine + 1,
        value: '\n'.repeat(blankBlock.count - 1)
      })
      screenLine += blankBlock.count
    }
  }

  //  if exec lines, insert at end of editor lines
  if (execLines.length > 0) {
    for (const execLine of execLines) {
      actions.push({
        action: 'insertLine', screenLine, value: execLine.codeLine,
        error: { error: ErrorCodes.NOT_ALLOWED, location: 0, endLocation: execLine.codeLine.length } })
      cursorScreenLine = screenLine
      screenLine += 1
    }
  }

  if (cursorScreenLine < 0) { cursorScreenLine = screenLine - 1 }

  actions.push({ action: 'setLine', screenLine: cursorScreenLine + 1 })

  // done
  return actions
}

export {
  processLineActions
}
