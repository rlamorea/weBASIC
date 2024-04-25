import Statement from './statement.js'
import FixedInput from '../../machine/screens/fixedInput.js'
import nextToken from '../tokenizer.js'
import { ErrorCodes, error } from '../errors.js'

const defaultInputPrompt = '? '

let currentInput = null
let inputPromise = null
let resolvePromise = null
let rejectPromise = null

function handleInput(machine, statement, interpreter, input) {
  machine.currentInput = null
  let values = input.split(',')
  let err = null
  let tokenStart = 0
  let tokenEnd = 1
  let varIdx = 0
  while (values.length > 0) {
    let value = values.shift()
    tokenEnd += value.length
    const variable = statement.inputVariables[varIdx++]
    if (varIdx >= statement.inputVariables.length && values.length > 0) {
      err = error(ErrorCodes.TOO_MANY_INPUTS, tokenEnd, input.length - 1, input)
      break
    }
    if (variable.valueType === 'number') {
      const numberToken = nextToken(value, 0, true)
      if (numberToken.error) {
        err = error(numberToken.error, numberToken.location, numberToken.endLocation, input)
        break
      }
      if (numberToken.coding !== 'number-literal') {
        err = error(ErrorCodes.ILLEGAL_VALUE, tokenStart, tokenEnd, input)
        break
      }
      const interpretedValue = interpreter.interpretExpression(numberToken)
      if (interpretedValue.error) {
        err = error(interpretedValue.error, interpretedValue.location, interpretedValue.endLocation, input)
        break
      }
      machine.variables.setValue(variable, interpretedValue, interpreter)
    } else {
      machine.variables.setValue(variable, { value: value.trim(), valueType: 'string' }, interpreter)
    }
    tokenStart = tokenEnd + 1
  }
  if (err) {
    rejectPromise(err)
  } else {
    resolvePromise({done: true})
  }
  currentInput = null
  inputPromise = null
  resolvePromise = null
  rejectPromise = null
}

export default class Input extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
      "statement|INPUT" : this.parseInput
    }
    this.interpreterHandlers = {
      'statement|INPUT' : this.doInput
    }
  }

  parseInput(statement, tokens, lexifier) {
    let prompt = ''
    let showQuestion = true
    let inputVariables = []
    let tokenEnd = statement.tokenEnd
    if (tokens.length > 0 && tokens[0].coding === 'string-literal') {
      prompt = tokens.shift()
      tokenEnd = prompt.tokenEnd
      prompt = prompt.token
      showQuestion = false
      if (tokens.length > 0 && tokens[0].coding === 'semicolon') {
        const t = tokens.shift()
        tokenEnd = t.tokenEnd
        showQuestion = true
      }
    }
    while (tokens.length > 0) {
      let token = tokens.shift()
      tokenEnd = token.tokenEnd
      if (!token.coding.startsWith('variable-')) {
        return error(ErrorCodes.SYNTAX, statement.tokenStart, tokenEnd)
      }
      inputVariables.push(token)
      if (tokens.length > 0 && tokens[0].coding === 'open-paren') {
        const parenToken = tokens.shift()
        const result = lexifier.parseVariableDimensions(token, parenToken, tokens)
        if (result.error) { return result }
        tokens = result.restOfTokens
      }
      if (tokens.length > 0) {
        token = tokens.shift()
        tokenEnd = token.tokenEnd
        if (token.coding !== 'comma') {
          return error(ErrorCodes.SYNTAX, statement.tokenStart, tokenEnd)
        }
      }
    }
    if (inputVariables.length === 0) {
      return error(ErrorCodes.SYNTAX, statement.tokenStart, tokenEnd)
    }
    statement.prompt = prompt
    statement.showQuestion = showQuestion
    statement.inputVariables = inputVariables
    return statement
  }

  async doInput(machine, statement, interpreter) {
    let stringToDisplay = ''
    if (statement.prompt) {
      stringToDisplay = statement.prompt
    }
    if (statement.showQuestion) { stringToDisplay += defaultInputPrompt }
    machine.currentScreen.displayString(stringToDisplay, false)

    inputPromise = new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })
    currentInput =  new FixedInput(machine.currentScreen, {
      singleLine: true,
      inputHandler: (input) => { handleInput(machine, statement, interpreter, input) }
    })
    machine.currentInput = currentInput // this is really here so we can do testing by pushing to input
    return inputPromise
  }
}
