import FixedScreen from './fixedscreen.js'
import FixedInput from './fixedinput.js'
import Interpreter from './interpreter.js'

const startupMessage = 'weBASIC v0.1'
const prompt = 'READY.'

export default class LiveScreen {
  constructor() {
    this.div = document.getElementById('live-screen')
    this.screen = new FixedScreen(this.div)

    this.div.addEventListener('initialized', () => { this.start() })
  }

  start() {
    this.div.style.display = 'block' // show it

    this.screen.displayStringAtCursor(startupMessage)
    this.screen.newline()
    this.screen.displayStringAtCursor(prompt)

    this.commandInput = new FixedInput(this.screen, { inputHandler: (input) => { this.handleCommand(input) } })
  }

  handleCommand(input) {
    const interpreter = new Interpreter({ screen: this.screen })
    const result = interpreter.interpretLine(input)
    let options = { inputHandler: (input) => { this.handleCommand(input) } }
    if (result.error) {
      this.screen.displayStringAtCursor(`ERROR: ${result.error} at position ${result.location}`)
      options.prefill = input
      options.errorLocation = result.location
      options.errorEndLocation = result.endLocation
    }

    this.screen.newline()
    this.screen.displayStringAtCursor(prompt)
    delete this.commandInput
    this.commandInput = new FixedInput(this.screen, options)
  }
}
