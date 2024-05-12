import CharGridScreen from "./charGridScreen.js";

export default class RunScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = document.createElement('div')
    div.id = 'run-screen-text'
    div.classList.add('chargrid', 'fixed') // TODO: fixed is temporary
    document.body.appendChild(div)
    super('run-screen-text', div, machine, options)
  }

  initialized() {
  }

  activated(active) {
  }
}
