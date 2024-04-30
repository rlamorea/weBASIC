import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'

const startupMessage = 'weBASIC v0.1'
const prompt = 'READY.'

export default class LiveScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = document.createElement('div')
    div.id = 'live-screen'
    div.classList.add('chargrid', 'fixed')
    document.body.appendChild(div)
    super('live-screen', div, machine, options)
  }

  initialized() {
    this.div.style.display = 'block' // show it

    this.displayString(startupMessage)
    this.newline()
    this.displayString(prompt)

    this.commandInput = new FixedInput(this, { inputHandler: (input) => { this.handleCommand(input) }, singleLine: true  })
    this.machine.activateMode('LIVE')
    this.machine.io.setActiveListener(this.commandInput)
  }

  activated(active) {
    this.machine.io.setActiveListener(active ? this.commandInput : null)
    this.commandInput.activate(active)
  }

  async handleCommand(input) {
    this.machine.io.setActiveListener()
    this.newline()
    const result = await this.machine.runLiveCode(input)
    let options = { inputHandler: (input) => { this.handleCommand(input) } }
    if (result.error) {
      this.displayString(errorString(result))
      if (!result.sourceText) {
        options.prefill = input
        options.errorLocation = result.location
        options.errorEndLocation = result.endLocation
      }
    }

    this.newline()
    this.displayString(prompt)
    delete this.commandInput
    this.commandInput = new FixedInput(this, options)
    this.machine.io.setActiveListener(this.commandInput)
  }
}