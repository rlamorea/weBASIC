// build mocks
global.window = {
  innerWidth: 900, innerHeight: 650,
  getComputedStyle: (div, x) => {
    return { getPropertyValue: (p) => { return 'black' } }
  }
}

import { default as MachineX } from '../scripts/machine/machine.js'

import Variables from '../scripts/machine/variables.js'
import CharGridScreen from '../scripts/machine/screens/charGridScreen.js'
import Execution from '../scripts/machine/execution.js'

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

      this.screen = new CharGridScreen('fixed-test', this.div, this, { refCell });
      this.currentScreen = this.screen
    }
  }
}
