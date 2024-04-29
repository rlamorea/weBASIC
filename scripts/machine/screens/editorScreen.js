import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'

export default class EditorScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = document.createElement('div')
    div.id = 'editor-screen'
    div.classList.add('chargrid', 'fixed')
    document.body.appendChild(div)
    super('editor-screen', div, options)
    this.machine = machine
  }

  initialized() {
    this.div.style.display = 'none' // show it
    this.screen = this.machine.screens.EDIT // for convenience

    this.screen.displayString('weBASIC 0.1 Editor Test', false)
  }
}