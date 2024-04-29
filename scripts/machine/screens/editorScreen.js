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
    this.firstActivated = false

    this.displayString('weBASIC 0.1 Editor Test', false)
  }

  activated(active) {
    if (!active || this.firstActivated) { return }

    this.editorDiv = document.createElement('div')
    this.editorDiv.style.position = 'absolute'
    this.editorDiv.style.top = `-${this.panelSettings.borderOffset.bottom}px`
    this.editorDiv.style.left = '0'
    this.editorDiv.style.width = '100%'
    this.editorDiv.style.height = this.panelSettings.borderOffset.bottom + 'px'

    this.div.appendChild(this.editorDiv)

    // NOTE: full list of colors here - https://github.com/microsoft/monaco-editor/issues/1631
    monaco.editor.defineTheme('weBASIC', {
      base: 'vs', inherit: true, rules: [],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ffffff',
        'editorCursor.foreground': '#ffffff',
      }
    })

    this.editor = monaco.editor.create(this.editorDiv, {
      lineNumbers: false,
      fontFamily: 'monospace',
      fontSize: `${this.fontSize}px`,
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      minimap: { enabled: false },
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      cursorStyle: 'underline',
      renderLineHighlight: 'none',
      letterSpacing: `${this.letterSpacing}px`,
      scrollBeyondLastLine: false,
      scrollBar: { horizontal: "hidden" },
      wordWrap: 'on',
      theme: 'weBASIC',
      value: '0 REM Hello World',
      language: 'BASIC'
    });

    this.editor.focus()
    this.machine.io.useDefault()
  }
}