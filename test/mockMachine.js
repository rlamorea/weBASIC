// build mocks
global.window = {
  innerWidth: 900, innerHeight: 650,
  getComputedStyle: (div, x) => {
    return { getPropertyValue: (p) => { return 'black' } }
  }
}

import { default as MachineX } from '../scripts/machine/machine.js'
import FileSystem from '../scripts/machine/filesystem.js'

import CharGridScreen from '../scripts/machine/screens/charGridScreen.js'

class mockClassList {
  constructor() { this.classes = {} }
  add(x) {
    for (const arg of arguments) {
      this.classes[arg] = true
    }
  }
  remove(x) {
    for (const arg of arguments) {
      if (arg in this.classes) {
        delete this.classes[arg]
      }
    }
  }
}

class MockFileSystem extends FileSystem {
  constructor(machine, fsContents) {
    super(machine)

    this.fsContents = fsContents
    this.currentDir = '/'
  }
  pathKey(filename) {
    let pathKey = (filename === null) ? this.currentDir : (filename.startsWith(this.currentDir) ? '' : this.currentDir)
    pathKey += (filename === null) ? '' : filename
    return pathKey
  }
  async getCatalog(path, prefix, suffix) {
    let pathKey = (path === undefined) ? this.currentDir : path
    if (prefix) { pathKey += '+'+prefix }
    if (suffix) { pathKey += '-'+suffix }
    return { path: pathKey, files: this.fsContents[pathKey] }
  }
  async saveFile(fileContents, filename) {
    const filepath = this.pathKey(filename)
    this.fsContents[filepath] = fileContents
    return { success: true, filepath }
  }
  async loadFile(filename) {
    const filepath = this.pathKey(filename)
    return { success: true, filepath, fileContents: this.fsContents[filepath] }
  }
  async setCurrentDirectory(path) {
    this.currentDir = path
    if (!this.currentDir.endsWith('/')) { this.currentDir += '/' }
    return { created: true, path: this.currentDir }
  }
  async scratchFile(filename) {
    delete this.fsContents[this.pathKey(filename)]
    return true
  }
  async copyFile(filename, newfile) {
    this.fsContents[this.pathKey(newfile)] = this.fsContents[this.pathKey(filename)]
    return true
  }
  async renameFile(filename, newfile) {
    const fkey = this.pathKey(filename)
    const contents = this.fsContents[fkey]
    delete this.fsContents[fkey]
    this.fsContents[this.pathKey(newfile)] = contents
    return true
  }
}

global.document = {
  createElement: (tag) => { return {
    innerHTML: '',
    style: { },
    dataset: { },
    classList: new mockClassList(),
    remove: () => { /* do nothing */ }
  } },
  adoptedStyleSheets: [ { insertRule: (x) => { /* do nothing */ }} ],
  body: { appendChild: () => { /* do nothing */ } }
}

let refCell = {
  offsetWidth: 12, offsetHeight: 24,
  remove: () => { /* do nothing */ }
}

import IO from '../scripts/machine/io.js'

export default class Machine extends MachineX {
  constructor(options = {}) {
    super({ ...options, noscreens: true })

    this.fileSystem = new MockFileSystem(this, options.files)

    if (options.addScreen) {
      this.screenCells = []

      let self = this
      this.div = {
        style: {},
        appendChild: (ch) => { self.screenCells.push(ch) },
        dispatchEvent: (x) => { /* do nothing */ },
        querySelector: (x) => {
          const m = x.match(/\[data-column="(\d+)"\]\[data-row="(\d+)"\]/)
          const idx = (parseInt(m[2]) - 1) * self.screen.viewportSize[0] + (parseInt(m[1]) - 1)
          return self.screenCells[idx]
        },
        querySelectorAll: (x) => { return self.screenCells }
      }

      this.screens = {
        'LIVE': new CharGridScreen('fixed-test', this.div, this, {refCell}),
        'RUN': new CharGridScreen('run-test', this.div, this, {refCell}),
        'EDIT': { resetEditor: () => { }, div: this.div, activated: (x) => { } }
      }
      for (const s in this.screens) { const sc = this.screens[s]; sc.displayMessage = (m) => { sc.displayString(m) } }
      this.currentScreen = this.screens['LIVE']
      this.screen = this.screens['LIVE']
    }
  }
}
