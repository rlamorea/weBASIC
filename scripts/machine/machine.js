import Variables from "./variables.js"
import Execution from './execution.js'
import IO from './io.js'

export default class Machine {
  constructor(options = {}) {
    this.currentMode = 'LIVE'
    this.io = new IO(this, { ...options, breakCallback: () => { this.onBreak() } })

    if (!options.noscreens) {
      this.screens = {}
      let self = this
      import('./screens/liveScreen.js').then( (module) => {
        self.screens.LIVE = new module.default(self)
        this.currentScreen = this.screens[this.currentMode]
      })
      import('./screens/editorScreen.js').then( (module) => {
        self.screens.EDIT = new module.default(self)
      })
    }

    this.variables = new Variables(this)
    this.execution = new Execution(this)

    this.liveCodespace = this.execution.createCodespace('LIVE')
  }

  activateMode(mode) {
    this.currentMode = mode
    this.currentScreen = this.screens[this.currentMode]
    this.io.setActiveListener() // clear any active listener from old mode
    for (const screen in this.screens) {
      this.screens[screen].div.style.display = (screen === this.currentMode) ? 'block' : 'none'
      this.screens[screen].activated(screen === this.currentMode)
    }
  }

  async runLiveCode(codeLine, acceptedList) {
    const result = this.execution.addCodeLine(this.liveCodespace, 0, codeLine, acceptedList)
    if (result.error) { return result }
    return await this.execution.runCode(this.liveCodespace)
  }

  onBreak() {
    this.execution.break()
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