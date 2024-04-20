import Variables from '../scripts/machine/variables.js'
import CharGridScreen from '../scripts/machine/screens/charGridScreen.js';

// build mocks
global.window = {
  innerWidth: 900, innerHeight: 650,
  getComputedStyle: (div, x) => {
    return { getPropertyValue: (p) => { return 'black' } }
  }
}

global.document = {
  createElement: (tag) => { return { innerHTML: '', dataset: { }, classList: { add: (x) => { /* do nothing */ } } } },
  adoptedStyleSheets: [ { replace: (x) => { /* do nothing */ }} ]
}

let refCell = {
  offsetWidth: 12, offsetHeight: 24,
  remove: () => { /* do nothing */ }
}

export default class Machine {
  constructor(options) {
    options = options || {}
    this.variables = new Variables()
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

      this.screen = new CharGridScreen('fixed-test', this.div, { refCell });
      this.currentScreen = this.screen
    }
  }
}
