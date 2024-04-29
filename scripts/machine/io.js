// key handling
const nonRepeatableKeys = [ 'Alt', 'Meta', 'Control', 'Shift', 'Escape', 'CapsLock', 'Enter' ]
const defaultBreakKey = 'Escape'
const defaultRepeatStartDelay = 500
const defaultRepeatDelay = 250

// for testing
let gwindow = (typeof window === 'undefined') ? { addEventListener: () => { } } : window

gwindow.addEventListener('load', (event) => {
  gwindow.addEventListener('keydown', (e) => { keyDown(e) })
  gwindow.addEventListener('keypress', (e) => { keyPress(e) })
  gwindow.addEventListener('keyup', (e) => { keyUp(e) })
})

let registeredInput = null
let overrideDefault = true
let defaultToggle = null

function keyDown(evt) {
  if (overrideDefault) {
    evt.preventDefault()
    if (!registeredInput) return // do nothing
    registeredInput.handleKeyDown(evt)
  } else if (evt.key === defaultToggle) {
    evt.preventDefault()
    overrideDefault = true
  }
}

function keyPress(evt) {
  if (overrideDefault) { evt.preventDefault() }
}

function keyUp(evt) {
  if (overrideDefault) {
    evt.preventDefault()
    if (!registeredInput) return
    registeredInput.handleKeyUp(evt)
  }
}

export default class IO {
  constructor(machine, options = {}) {
    this.machine = machine
    this.activeListener = options.activeListener

    this.repeatKeys = ('repeatKeys' in options) ? options.repeatKeys : true
    this.repeatStartDelay = options.repeatStartDelay || defaultRepeatStartDelay
    this.repeatDelay = options.repeatDelay || defaultRepeatDelay
    this.repeatKeyDown = null

    this.captureCurrentKey = options.captureCurrentKey
    this.currentKeyPressed = null

    this.captureBreakKey = options.captureBreakKey
    this.breakKey = defaultBreakKey
    this.breakCallback = options.breakCallback

    registeredInput = this
  }

  useDefault(use = true, toggleBack = 'Escape') {
    overrideDefault = !use
    defaultToggle = toggleBack
  }

  handleKeyDown(evt) {
    if (this.activeListener) {
      this.activeListener.handleKey(evt)
      if (this.repeatKeys && nonRepeatableKeys.indexOf(evt.key) < 0) {
        this.repeatKeyDown = evt
        setTimeout( () => { this.repeatKey(evt) }, this.repeatStartDelay)
      }
    } else if (this.captureCurrentKey) {
      this.currentKeyPressed = evt
    }
    // break is always enabled
    if (this.breakCallback && this.captureBreakKey && evt.key === this.breakKey) {
      this.breakCallback()
    }
  }

  handleKeyUp(evt) {
    this.repeatKeyDown = null
    this.currentKeyPressed = null
  }

  repeatKey(evt) {
    if (!this.repeatKeys) return
    if (evt !== this.repeatKeyDown) return
    this.handleKeyDown(evt)
    setTimeout(() => { this.repeatKey(evt) }, this.repeatDelay)
  }

  currentKey() {
    return (this.captureCurrentKey ? this.currentKeyPressed : null)
  }

  setActiveListener(listener, options = {}) {
    if (listener) {
      this.activeListener = listener
      this.repeatKeys = ('repeatKeys' in options) ? options.repeatKeys : true
      this.repeatStartDelay = options.repeatStartDelay || defaultRepeatStartDelay
      this.repeatDelay = options.repeatDelay || defaultRepeatDelay
    } else {
      this.activeListener = null
    }
  }

  enableCapture(enable = true) {
    this.captureCurrentKey = enable
  }

  enableBreak(enable = true, breakKey = defaultBreakKey) {
    this.captureBreakKey = enable
    this.breakKey = breakKey
  }
}