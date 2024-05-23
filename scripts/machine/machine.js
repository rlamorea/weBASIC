import Variables from "./variables.js"
import Execution from './execution.js'
import IO from './io.js'
import FileSystem from './filesystem.js'

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
      import('./screens/runScreen.js').then( (module) => {
        self.screens.RUN = new module.default(self)
      })
      // import('./screens/setup.js').then( (module) => {
      //   self.setupScreen = new module.default(self)
      //   self.settings = self.setupScreen.getSettings()
      // })
    }

    this.variables = new Variables(this)
    this.execution = new Execution(this)

    this.liveCodespace = this.execution.createCodespace('LIVE')
    this.runCodespace = this.execution.createCodespace('RUN')

    this.fileSystem = new FileSystem(this)
  }

  activateMode(mode) {
    this.currentMode = mode
    this.currentScreen = this.screens[this.currentMode]
    let activatedScreen = null
    for (const screen in this.screens) {
      if (screen === this.currentMode) {
        activatedScreen = this.screens[screen]
        continue
      }
      this.screens[screen].div.style.display = 'none'
      this.screens[screen].activated(false)
    }
    activatedScreen.div.style.display = 'block'
    activatedScreen.activated(true)
  }

  passCode(code) {
    this.currentScreen.handleCommand(code, true)
  }

  async runLiveCode(codeLine, acceptedList) {
    const result = this.execution.addCodeLine(this.liveCodespace, 0, codeLine, acceptedList)
    if (result.error) { return result }
    this.execution.prepCodespaceForRun(this.liveCodespace)
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