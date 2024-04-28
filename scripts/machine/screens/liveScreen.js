import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'

const startupMessage = 'weBASIC v0.1'
const prompt = 'READY.'

export default class LiveScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    const div = document.getElementById('live-screen')
    super('live-screen', div, options)
    this.machine = machine
  }

  initialized() {
    this.div.style.display = 'block' // show it
    this.screen = this.machine.screens.LIVE // for convenience

    this.screen.displayString(startupMessage)
    this.screen.newline()
    this.screen.displayString(prompt)

    this.commandInput = new FixedInput(this.screen, { inputHandler: (input) => { this.handleCommand(input) }, singleLine: true  })
    this.machine.activateMode('LIVE')
    this.machine.io.setActiveListener(this.commandInput)
  }

  async handleCommand(input) {
    this.machine.io.setActiveListener()
    const result = await this.machine.runLiveCode(input)
    let options = { inputHandler: (input) => { this.handleCommand(input) } }
    if (result.error) {
      this.screen.displayString(errorString(result))
      if (!result.sourceText) {
        options.prefill = input
        options.errorLocation = result.location
        options.errorEndLocation = result.endLocation
      }
    }

    this.screen.newline()
    this.screen.displayString(prompt)
    delete this.commandInput
    this.commandInput = new FixedInput(this.screen, options)
    this.machine.io.setActiveListener(this.commandInput)
  }
}