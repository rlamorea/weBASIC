import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'
import {clear} from "idb-keyval";

const pauseMessage = 'SPACE to continue, ESC to stop'
const pauseMessageErase = ' '.repeat(pauseMessage.length)

function parseStringParams(tokens, statement, lexifier, maxParams = 1, minParams = 0) {
  let params = lexifier.parseIntoParameters(tokens, statement.tokenEnd, true)
  if (params.error) { return params }
  params = params.parameters
  if (params.length < minParams) {
    return error(ErrorCodes.SYNTAX, statement.tokenStart, statement.tokenEnd)
  }
  const stringParams = []
  for (let paramIdx = 0; paramIdx < Math.min(params.length, maxParams); paramIdx++) {
    const paramTokens = params[paramIdx]
    if (paramTokens.length === 0) {
      stringParams.push('')
      continue
    }
    if (paramTokens.length > 1) {
      return error(ErrorCodes.SYNTAX, paramTokens[1].tokenStart, paramTokens[1].tokenEnd)
    }
    const param = paramTokens[0]
    if (param.coding !== 'string-literal') {
      return error(ErrorCodes.SYNTAX, param.tokenStart, param.tokenEnd)
    }
    stringParams.push(param.token)
  }
  return stringParams
}

let directoryPromise = null
let directoryResolve = null
let keypressPromise = null
let keypressResolve = null
let directoryPage = -1

const continueListener = {
  handleKey(evt) {
    if (evt.key === ' ') {
      keypressResolve('continue')
    }
  }
}
function breakHandler() {
  keypressResolve('break')
}

async function waitOnKeypress(machine) {
  keypressPromise = new Promise((resolve) => { keypressResolve = resolve })
  machine.io.setActiveListener(continueListener)
  machine.io.enableBreak(true, null, breakHandler)
  if (keypressPromise) {
    return keypressPromise
  } else {
    return 'continue'
  }
}

function clearKeyHandling(machine) {
  machine.io.setActiveListener()
  machine.io.enableBreak(true) // restore default break handler
  keypressPromise = null
  keypressResolve = null
}

function clearDirectoryPromise() {
  directoryPromise = null
  directoryResolve = null
}

async function paginateDirectory(machine, files, pageNumber) {
  directoryPromise = new Promise((resolve) => { directoryResolve = resolve })
  let pageLength = machine.currentScreen.viewportSize[1] - 1 - (pageNumber === 1 ? 1 : 0)
  let pageFiles = (files.length < pageLength)
  // check to make sure the final prompt won't cause files to be missed
  if (files.length < pageLength && files.length > machine.currentScreen.viewportSize[1] - 3) {
    pageLength = machine.currentScreen.viewportSize[1] - 3
  }
  if (files.length < pageLength) {
    pageFiles = files
    files = []
  } else {
    pageFiles = files.splice(0, pageLength)
  }
  for (let file of pageFiles) {
    if (file.length > machine.currentScreen.viewportSize[0] - 3) {
      file = file.substring(0, machine.currentScreen.viewportSize[0] - 6) + '...'
    }
    machine.currentScreen.displayString('  ' + file)
  }
  if (files.length > 0) {
    machine.currentScreen.displayString(pauseMessage, false)
    const action = await waitOnKeypress(machine)
    clearKeyHandling(machine)
    machine.currentScreen.moveTo([ 1, machine.currentScreen.viewportCursorLocation[1] ])
    machine.currentScreen.displayString(pauseMessageErase, false)
    machine.currentScreen.moveTo([ 1, machine.currentScreen.viewportCursorLocation[1] ])
    if (action === 'continue') {
      await paginateDirectory(machine, files, pageNumber + 1)
    } else {
      directoryResolve(true)
    }
  } else {
    directoryResolve(true)
  }
  return directoryPromise
}

export default class Files extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      'command|CATALOG': this.parseCatalog,
      'command|SAVE': this.parseSave,
      'command|LOAD': this.parseLoad,
      'command|SETDIR': this.parseSetDir,
      'command|SCRATCH': this.parseScratch,
      'command|COPY': this.parseCopyRename,
      'command|RENAME': this.parseCopyRename,
    }
    this.interpreterHandlers = {
      'command|CATALOG' : this.doCatalog,
      'command|SAVE': this.doSave,
      'command|LOAD': this.doLoad,
      'command|SETDIR': this.doSetDir,
      'command|SCRATCH': this.doScratch,
      'command|COPY': this.doCopy,
      'command|RENAME': this.doRename
    }
  }

  parseCatalog(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 3)
    if (params.error) { return params }

    statement.path = params[0]
    statement.filePrefix = params[1]
    statement.fileSuffix = params[2]

    return statement
  }

  parseSave(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 1, 0)
    if (params.error) { return params }

    statement.fileName = params[0]
    return statement
  }

  parseLoad(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 1, 1)
    if (params.error) { return params }

    statement.fileName = params[0]
    return statement
  }

  parseSetDir(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 1, 1)
    if (params.error) { return params }

    statement.path = params[0]
    return statement
  }

  parseScratch(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 1, 1)
    if (params.error) { return params }

    statement.pathToScratch = params[0]
    return statement
  }

  parseCopyRename(statement, tokens, lexifier) {
    const params = parseStringParams(tokens, statement, lexifier, 2, 2)
    if (params.error) { return params }

    statement.sourceFile = params[0]
    statement.destinationFile = params[1]
    return statement
  }

  async doCatalog(machine, statement, interpreter) {
    const catalog = await machine.fileSystem.getCatalog(statement.path, statement.filePrefix, statement.fileSuffix)
    if (catalog.error) { return catalog }

    machine.currentScreen.displayString(`In ${catalog.path}`)
    await paginateDirectory(machine, catalog.files, 1)
    clearDirectoryPromise()
    return { done: true }
  }

  async doSave(machine, statement, interpreter) {
    if (machine.runCodespace.lineNumbers.length === 0) {
      return error(ErrorCodes.NO_PROGRAM)
    }
    let filename = statement.fileName
    if (!filename) {
      filename = machine.fileSystem.currentFile
      if (!filename) {
        return error(ErrorCodes.NO_FILE)
      }
    }

    const result = await machine.fileSystem.saveProgram(machine.runCodespace, filename)
    if (result.error) { return result }
    machine.fileSystem.setCurrentFile(result.filepath)
    machine.currentScreen.displayMessage(`File Saved`)
    return { done: true }
  }

  async doLoad(machine, statement, interpreter) {
    const result = await machine.fileSystem.loadProgram(statement.fileName)
    if (result.error) { return result }
    machine.fileSystem.setCurrentFile(result.filepath)

    machine.execution.resetCodespaceToNew(machine.runCodespace)
    const lines = result.fileContents.split('\n')
    if (lines[lines.length - 1].trim() === '') { lines.pop() }
    for (const line of lines) {
      machine.execution.addCodeLine(machine.runCodespace, -1, line)
    }
    machine.currentScreen.displayMessage(`${lines.length} BASIC lines loaded`)
    machine.screens['EDIT'].resetEditor()
    return { done: true }
  }

  async doSetDir(machine, statement, interpreter) {
    const result = await machine.fileSystem.setCurrentDirectory(statement.path)
    if (result.error) { return result }
    machine.currentScreen.displayMessage(`${result.created ? 'Created' : 'Now in'} ${result.path}`)
    return { done: true }
  }

  async doScratch(machine, statement, interpreter) {
    const result = await machine.fileSystem.scratchFile(statement.pathToScratch)
    if (result.error) { return result }
    if (result.filepath === machine.fileSystem.currentFile) {
      machine.fileSystem.setCurrentFile() // clear current file if we scratched it
    }
    machine.currentScreen.displayMessage(`Scratched ${result.filepath}`)
    return { done: true }
  }

  async doCopy(machine, statement, interpreter) {
    const result = await machine.fileSystem.copyFile(statement.sourceFile, statement.destinationFile)
    if (result.error) { return result }
    machine.currentScreen.displayMessage(`Copied to ${result.newpath}`)
    return { done: true }
  }

  async doRename(machine, statement, interpreter) {
    const result = await machine.fileSystem.renameFile(statement.sourceFile, statement.destinationFile)
    if (result.error) { return result }
    if (result.filepath === machine.fileSystem.currentFile) {
      machine.fileSystem.setCurrentFile(result.newpath)
    }
    machine.currentScreen.displayMessage(`Renamed to ${result.newpath}`)
    return { done: true }
  }
}
