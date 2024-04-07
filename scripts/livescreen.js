import { initScreen, displayString, getCell } from './fixedscreen.js'
import FixedInput from './fixedinput.js'

const startupMessage = 'WBASIC v0.1'
const prompt = 'READY'

export default class LiveScreen {
  constructor() {
    this.div = document.getElementById('live-screen')
    initScreen(this.div)

    this.div.addEventListener('initialized', () => { this.start() })
  }

  start() {
    this.div.style.display = 'block' // show it

    displayString(this.div, 1, 1, startupMessage)
    displayString(this.div, 1, 3, prompt)

    this.inputLine = 4
    this.commandInput = new FixedInput(this.div, [ 1, this.inputLine ])
  }
}
