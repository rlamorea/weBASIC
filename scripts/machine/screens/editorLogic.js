
function processLineActions(codeLine, screenLine, machine, editorContents) {
  const lexifier = machine.execution.interpreter.lexifier // UGH!
  const { cleanTokens, lineNumber: codeLineNumberToken, emptyLine } = lexifier.identifyCleanTokens(codeLine)

  const codeLineNumber = parseInt(codeLineNumberToken.token)
  const codeLineInfo = machine.execution.indexForLineNumber(machine.runCodespace, codeLineNumber, 'before')
  let codeLineIndex = (codeLineNumber > codeLineInfo.lineNumber) ? codeLineInfo.lineIndex + 1 : codeLineInfo.lineIndex
  let editorLines = editorContents.split('\n')
  if (editorLines[editorLines.length - 1] === '') { editorLines.pop() }

  let actions = []
  let unmatchedLine = (screenLine !== codeLineIndex + 1)
  // check for special case of inserted line just above actual line
  if (!unmatchedLine && codeLineIndex < editorLines.length - 1) {
    const { lineNumber: nextLineNumberToken } = lexifier.identifyCleanTokens(editorLines[codeLineIndex + 1])
    const nextLineNumber = parseInt(nextLineNumberToken.token)
    if (nextLineNumber === codeLineNumber) { unmatchedLine = true }
  }
  if (screenLine > 0) {
    actions.push({ action: 'clearLine', screenLine })
    editorLines.splice(screenLine - 1, 1)
  }
  let finalScreenLine = codeLineInfo.lineIndex + 1

  // now scan to see if there are any lines that need to be re-inserted
  let expectedLineCount = machine.runCodespace.lineNumbers.length - (codeLineInfo.existing ? 1 : 0)
  if (emptyLine && unmatchedLine && codeLineInfo.existing) { expectedLineCount -= 1 }
  if (editorLines.length > 0  && editorLines.length !== expectedLineCount) {
    let editIdx = 0
    for (let idx = 0; idx < machine.runCodespace.lineNumbers.length; idx++) {
      const expectedLineNumber = machine.runCodespace.lineNumbers[idx]
      if (expectedLineNumber === codeLineNumber && !emptyLine) { continue }
      let screenLineNumber = -1
      if (editIdx < editorLines.length) {
        const ct = lexifier.identifyCleanTokens(editorLines[editIdx]) // UGH!
        screenLineNumber = parseInt(ct.lineNumber.token)
      }
      if (screenLineNumber !== expectedLineNumber) {
        actions.push({
          action: 'insertLine',
          value: machine.runCodespace.codeLines[expectedLineNumber].text,
          screenLine: idx + 1,
        })
      } else {
        editIdx += 1
      }
    }
  }
  if (emptyLine) {
    if (codeLineInfo.existing) {
      const deletedLineIndex = machine.execution.deleteCodeLine(machine.runCodespace, codeLineNumber)
      if (unmatchedLine) { actions.push({ action: 'clearLine', screenLine: deletedLineIndex + 1 }) }
      finalScreenLine = deletedLineIndex
    }
  } else {
    codeLine = lexifier.cleanCodeLine(codeLine, cleanTokens)
    const addResult = machine.execution.addCodeLine(machine.runCodespace, -1, codeLine) // -1 means read the line number
    codeLineIndex = addResult.lineNumberIndex
    finalScreenLine = codeLineIndex + 1
    let action = { action: 'insertLine', value: codeLine, screenLine: finalScreenLine }
    if (addResult.error) { action.error = addResult }
    actions.push(action)
  }
  actions.push({ action: 'setLine', screenLine: finalScreenLine + 1 })

  return actions
}

export {
  processLineActions
}