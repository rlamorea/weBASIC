import { initScreen, linesRequired, displayString, getCell, scrollScreen } from './fixedscreen.js'
import FixedInput from './fixedinput.js'

const startupMessage = 'weBASIC v0.1'
const prompt = 'READY'

export default class LiveScreen {
  constructor() {
    this.div = document.getElementById('live-screen')
    initScreen(this.div)

    this.div.addEventListener('initialized', () => { this.start() })
    this.div.addEventListener('scrolled', (e) => { this.scrollOffset(e.detail.xoffset, e.detail.yoffset) })
  }

  start() {
    this.div.style.display = 'block' // show it

    displayString(this.div, 1, 1, startupMessage)
    displayString(this.div, 1, 3, prompt)

    this.inputLine = 4
    this.commandInput = new FixedInput(this.div, [ 1, this.inputLine ], { inputHandler: (input) => { this.handleCommand(input) } })
  }

  scrollOffset(xoffset, yoffset) {
    this.inputLine += yoffset
  }

  handleCommand(input) {
    // TODO: process in some way, but for now...
    console.log('got [' + input + ']')

    this.inputLine += linesRequired(this.div, 1, this.inputLine, input.length)
    displayString(this.div, 1, this.inputLine, prompt)
    this.inputLine += 1
    delete this.commandInput
    this.commandInput = new FixedInput(this.div, [ 1, this.inputLine ], { inputHandler: (input) => { this.handleCommand(input) } })
  }
}
