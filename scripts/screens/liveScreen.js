import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import Interpreter from "../interpreter.js";

const startupMessage = 'weBASIC v0.1'
const prompt = 'READY.'

export default class LiveScreen extends CharGridScreen {
  constructor(options) {
    const div = document.getElementById('live-screen')
    super('live-screen', div, options)
    this.machine = options.machine
  }

  initialized() {
    this.div.style.display = 'block' // show it
    this.screen = this.machine.screens.LIVE // for convenience

    this.screen.displayString(startupMessage)
    this.screen.newline()
    this.screen.displayString(prompt)

    this.commandInput = new FixedInput(this.screen, { inputHandler: (input) => { this.handleCommand(input) } })
    this.machine.activateMode('LIVE')
  }

  handleCommand(input) {
    const interpreter = new Interpreter({ machine: this.machine })
    const result = interpreter.interpretLine(input)
    let options = { inputHandler: (input) => { this.handleCommand(input) } }
    if (result.error) {
      this.screen.displayString(`ERROR: ${result.error} at position ${result.location}`)
      options.prefill = input
      options.errorLocation = result.location
      options.errorEndLocation = result.endLocation
    }

    this.screen.newline()
    this.screen.displayString(prompt)
    delete this.commandInput
    this.commandInput = new FixedInput(this.screen, options)
  }
}