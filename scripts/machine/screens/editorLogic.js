
function processLineActions(codeLine, screenLine, machine, editorContents) {
  const lexifier = machine.execution.interpreter.lexifier // UGH!
  const { cleanTokens, lineNumber: codeLineNumberToken, emptyLine } = lexifier.identifyCleanTokens(codeLine)

  const codeLineNumber = parseInt(codeLineNumberToken.token)
  const codeLineInfo = machine.execution.indexForLineNumber(machine.runCodespace, codeLineNumber, 'before')
  let codeLineIndex = (codeLineNumber > codeLineInfo.lineNumber) ? codeLineInfo.lineIndex + 1 : codeLineInfo.lineIndex
  let editorLines = editorContents.split('\n')
  if (editorLines[editorLines.length - 1] === '') { editorLines.pop() }
  // snip out any blank lines -- remember where they were
  let blankLines = []
  let firstBlank = -1
  for (let lineIdx = 0; lineIdx < editorLines.length; lineIdx++) {
    const line = editorLines[lineIdx]
    if (line === '' && firstBlank < 0) {
      firstBlank = lineIdx
    } else if (line !== '' && firstBlank >= 0) {
      blankLines.push({ first: firstBlank, last: lineIdx - 1 })
      firstBlank = -1
    }
  }
  // now clip out blank lines from editor Lines for processing
  for (let blankIdx = blankLines.length - 1; blankIdx >= 0; blankIdx--) {
    const blank = blankLines[blankIdx]
    editorLines.splice(blank.first, blank.last - blank.first + 1)
  }

  let actions = []
  let unmatchedLine = (screenLine !== codeLineIndex + 1)
  // check for special case of inserted line just above actual line
  if (!unmatchedLine && codeLineIndex < editorLines.length - 1) {
    const { lineNumber: nextLineNumberToken } = lexifier.identifyCleanTokens(editorLines[codeLineIndex + 1])
    const nextLineNumber = parseInt(nextLineNumberToken.token)
    if (nextLineNumber === codeLineNumber) { unmatchedLine = true }
  }
  if (screenLine >= 0) {
    actions.push({ action: 'clearLine', screenLine })
    editorLines.splice(screenLine - 1, 1)
  } else if (codeLineInfo.existing) {
    actions.push({ action: 'clearLine', screenLine: codeLineIndex + 1})
    editorLines.splice(codeLineIndex, 1)
  }
  let finalScreenLine = codeLineInfo.lineIndex + 1

  // now scan to see if there are any lines that need to be re-inserted
  let expectedLineCount = machine.runCodespace.lineNumbers.length - (codeLineInfo.existing ? 1 : 0)
  if (emptyLine && unmatchedLine && codeLineInfo.existing) { expectedLineCount -= 1 }
  if (editorLines.length > 0  && editorLines.length !== expectedLineCount) {
    let editIdx = 0
    let idxAdjust = 0
    for (let idx = 0; idx < machine.runCodespace.lineNumbers.length; idx++) {
      const expectedLineNumber = machine.runCodespace.lineNumbers[idx]
      if (expectedLineNumber === codeLineNumber && !emptyLine) {
        idxAdjust = -1
        continue
      }
      let screenLineNumber = -1
      if (editIdx < editorLines.length) {
        const ct = lexifier.identifyCleanTokens(editorLines[editIdx]) // UGH!
        screenLineNumber = parseInt(ct.lineNumber.token)
      }
      if (screenLineNumber !== expectedLineNumber) {
        actions.push({
          action: 'insertLine',
          value: machine.runCodespace.codeLines[expectedLineNumber].text,
          screenLine: idx + 1 + idxAdjust,
        })
      } else {
        editIdx += 1
      }
    }
  }
  let finalAction = null
  if (emptyLine) {
    if (codeLineInfo.existing) {
      const deletedLineIndex = machine.execution.deleteCodeLine(machine.runCodespace, codeLineNumber)
      if (unmatchedLine) { finalAction = { action: 'clearLine', screenLine: deletedLineIndex + 1 } }
      finalScreenLine = deletedLineIndex
    }
  } else {
    codeLine = lexifier.cleanCodeLine(codeLine, cleanTokens)
    const addResult = machine.execution.addCodeLine(machine.runCodespace, -1, codeLine) // -1 means read the line number
    codeLineIndex = addResult.lineNumberIndex
    finalScreenLine = codeLineIndex + 1
    finalAction = { action: 'insertLine', value: codeLine, screenLine: finalScreenLine }
    if (addResult.error) { finalAction.error = addResult }
  }
  // now either put back or clear blank lines
  let lineAdjust = 1
  let blankLinesLeft = 0
  for (const blank of blankLines) {
    for (let lineIdx = blank.first; lineIdx <= blank.last; lineIdx++) {
      if (lineIdx < finalScreenLine || blank.first > finalScreenLine) {
        actions.push({ action: 'clearLine', screenLine: lineIdx + lineAdjust })
        lineAdjust -= (lineIdx < finalScreenLine) ? 1 : 0
      } else {
        blankLinesLeft += 1
      }
    }
  }
  if (finalAction) { actions.push(finalAction) }
  actions.push({ action: 'setLine', screenLine: finalScreenLine + 1 })

  // finally see if there are extra lines that need to be deleted
  const editorLineCount = editorLines.length + blankLinesLeft
  if (editorLineCount > machine.runCodespace.lineNumbers.length) {
    for (let idx = machine.runCodespace.lineNumbers.length; idx < editorLineCount; idx++) {
      actions.push({ action: 'clearLine', screenLine: idx + 1 })
    }
  }

  return actions
}

export {
  processLineActions
}