import LiveScreen from "./screens/liveScreen.js"
import Variables from "./variables.js"
import Execution from './execution.js'

export default class Machine {
  constructor(options = {}) {
    this.currentMode = 'LIVE'
    this.variables = new Variables()
    if (options.noScreens)
    this.screens = {
      LIVE: new LiveScreen({ machine: this }),
    }
    this.currentScreen = this.screens[this.currentMode]

    this.currentInput = null // TODO: move current input to execution?
    this.execution = new Execution()
  }

  activateMode(mode) {
    this.currentMode = mode
    this.currentScreen = this.screens[this.currentMode]
    for (const screen in this.screens) {
      this.screens[screen].div.style.display = (screen === this.currentMode) ? 'block' : 'none'
    }
  }
}

/*
  <div id="live-screen" class="chargrid fixed"></div>
  <div id="editor"></div>
  <div id="dump-edit-panel" class="chargrid fixed"></div>
  <div id="fixed-scroll-runscreen" class="chargrid scroll"></div>
  <div id="html-runscreen">
  <div id="bitmap-runscreen"></div>
  <div id="debug-panel" class="chargrid fixed"></div>

 */