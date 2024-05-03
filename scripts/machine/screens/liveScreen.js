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

    this.machine.activateMode('LIVE')

    this.displayString(startupMessage)
    this.newPrompt()
  }

  newPrompt(showPrompt = true, inputOptions = {}) {
    if (this.commandInput) {
      this.commandInput.activate(false)
      delete this.commandInput
    }
    const options = {
      inputHandler: (input) => { this.handleCommand(input) },
      ...inputOptions
    }
    if (showPrompt) {
      this.newline()
      this.displayString(prompt)
    }
    this.commandInput = new FixedInput(this, options)
    this.commandInput.activate()
    this.machine.io.setActiveListener(this.commandInput)
  }

  activated(active) {
    if (!this.commandInput) return
    if (active) {
      this.machine.io.setActiveListener(this.commandInput)
      this.commandInput.activate()
    } else if (this.commandInput) {
      this.commandInput.activate(false)
      this.machine.io.setActiveListener()
    }
  }

  async handleCommand(input, passed) {
    if (passed) {
      this.displayString(input)
    } else {
      //this.newline()
    }
    const result = await this.machine.runLiveCode(input)
    if (result.error && result.error === 'unexpected-line-number') {
      this.commandInput.reset()
      this.commandInput.activate(false)
      this.machine.activateMode('EDIT')
      this.machine.passCode(input)
      return
    }
    let options = {}
    if (result.error) {
      this.displayString(errorString(result))
      if (!result.sourceText) {
        options.prefill = input
        options.errorLocation = result.location
        options.errorEndLocation = result.endLocation
      }
    }

    this.newPrompt(true, options)

    if (result.newMode) {
      this.machine.activateMode(result.newMode)
      if (result.prepNewMode) { result.prepNewMode() }
    }
    return result

  }
}