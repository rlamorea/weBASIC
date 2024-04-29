import CharGridScreen from "./charGridScreen.js";
import FixedInput from "./fixedInput.js";
import { errorString } from '../../interpreter/errors.js'
import * as monaco from 'monaco-editor'
// or import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// if shipping only a subset of the features & languages is desired

export default class EditorScreen extends CharGridScreen {
  constructor(machine, options = {}) {
    let div = document.createElement('div')
    div.id = 'editor-screen'
    div.classList.add('chargrid', 'fixed')
    document.body.appendChild(div)
    options.panel = { location: 'bottom', rows: 2 }
    super('editor-screen', div, machine, options)
  }

  initialized() {
    this.div.style.display = 'none' // show it

    this.editorDiv = document.createElement('div')
    this.editorDiv.style.position = 'absolute'
    this.editorDiv.style.top = `-${this.panelSettings.borderOffset.bottom}px`
    this.editorDiv.style.left = '0'
    this.editorDiv.style.width = '100%'
    this.editorDiv.style.height = this.panelSettings.borderOffset.bottom + 'px'

    this.div.appendChild(this.editorDiv)

    monaco.editor.create(this.editorDiv, {
      value: '0 REM Hello World',
      language: 'basic'
    });

    this.displayString('weBASIC 0.1 Editor Test', false)
  }
}