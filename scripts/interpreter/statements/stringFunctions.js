import Statement from './statement.js'
import { ErrorCodes, error } from '../errors.js'

const prepValue = 1000.1
const prepString = prepValue.toLocaleString()
const defaultPlaceSeparator = prepString.substring(1, 2)
const defaultDecimalCharacter = prepString.substring(5, 6)
const defaultOverflowCharacter = 'x'
const normalPrecision = 10

function parseFormatChar(str) {
  if (str.length === 0) { return '' }
  let char = str[0]
  if (char === '@' && str.length > 1) {
    const charVal = parseInt(str.substring(1))
    if (isNaN(charVal) || !isFinite(charVal)) {
      return 'error'
    }
    char = String.fromCharCode(charVal)
  }
  return char
}

export default class StringFunctions extends Statement {
  constructor() {
    super()
    this.lexicalHandlers = {
    }
    this.interpreterHandlers = {
      'function|LEN' : this.doLEN,
      'function|CHARAT$': this.doCHARAT,
      'function|LEFT$': this.doLEFT,
      'function|RIGHT$': this.doRIGHT,
      'function|MID$': this.doMID,
      'function|ASC': this.doASC,
      'function|CHR$': this.doCHR,
      'function|VAL': this.doVAL,
      'function|STR$': this.doSTR,
    }
  }

  doLEN(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'string' ])
    if (confirm.error) { return confirm }
    return Statement.valReturn(statement, paramValues[0].value.length)
  }

  doCHARAT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const index = paramValues[1].value
    const str = paramValues[0].value
    if (index < 1 || index > str.length) { return error(ErrorCodes.ILLEGAL_INDEX, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    return Statement.strReturn(statement, paramValues[0].value[index - 1])
  }

  doLEFT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const len = paramValues[1].value
    if (len < 0) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    const str = paramValues[0].value
    let result = str
    if (len < str.length) { result = str.substring(0, len) }
    return Statement.strReturn(statement, result)
  }

  doRIGHT(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 2, [ 'string', 'number' ])
    if (confirm.error) { return confirm }
    const len = paramValues[1].value
    if (len < 0) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    const str = paramValues[0].value
    let result = str
    if (len < str.length) { result = str.substring(str.length - len) }
    return Statement.strReturn(statement, result)
  }

  doMID(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 2, 3, [ 'string', 'number', 'number' ])
    if (confirm.error) { return confirm }
    const midStart = paramValues[1].value
    const str = paramValues[0].value
    const midEnd = paramValues[2]?.value || str.length
    if (midStart < 1) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd) }
    if (midEnd < 1) { return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[2].tokenStart, statement.parameters[2].tokenEnd) }
    let result = str
    if (midStart > str.length) {
      result = ''
    } else {
      result = str.substring(midStart - 1, midEnd)
    }
    return Statement.strReturn(statement, result)
  }

  doASC(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'string' ])
    if (confirm.error) { return confirm }
    let result = 0
    if (paramValues[0].value.length > 0) {
      result = paramValues[0].value.charCodeAt(0)
    }
    return Statement.valReturn(statement, result)
  }

  doCHR(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'number' ])
    if (confirm.error) { return confirm }
    return Statement.strReturn(statement, String.fromCharCode(paramValues[0].value))
  }

  doVAL(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 1, [ 'any' ])
    if (confirm.error) { return confirm }
    if (paramValues[0].valueType === 'string' && paramValues[0].value.startsWith('.')) {
      paramValues[0].value = '0' + paramValues[0].value
    }
    const result = parseFloat(paramValues[0].value)
    if (isNaN(result) || !isFinite(result)) {
      return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[0].tokenStart, statement.parameters[0].tokenEnd)
    }
    return Statement.valReturn(statement, result)
  }

  doSTR(machine, statement, paramValues, interpreter) {
    const confirm = Statement.confirmParams(statement, paramValues, 1, 2, [ 'number', 'string' ])
    if (confirm.error) { return confirm }
    let formatOptions = {
      radix: 10,
      width: 0, // 0 means any width
      overflowCharacter: defaultOverflowCharacter,
      mantissa: 0, // 0 means any
      decimals: -1, // -1 means any
      separatePlaces: false,
      placeSeparator: '', // blank means none
      decimalCharacter: defaultDecimalCharacter,
      leadingZeros: ' ',
      negativeMethod: '', // precede negative with dash, positive with nothing
      scientificNotation: 2, // 0 = never, 1 = always , 2 = as needed
    }
    const number = paramValues[0].value
    let format = (paramValues.length === 2 ? paramValues[1].value : '').split(',')
    let formatError = false
    for (let option of format) {
      if (option === '') { continue }
      const formatOption = option.substring(0, 1)
      option = option.substring(1)
      switch (formatOption) {
        case 'r':
        case 'R':
          const radix = parseFloat(option || '')
          if (isNaN(radix) || !isFinite(radix)) { formatError = true; break }
          if (radix !== 10 && radix !== 16 && radix !== 8 && radix !== 2) { formatError = true; break }
          formatOptions.radix = radix
          break
        case 'w':
        case 'W':
          const width = parseInt(option || '')
          if (isNaN(width) || !isFinite(width)) { formatError = true; break }
          if (width <= 0) { formatError = true; break }
          formatOptions.width = width
          option = option.substring(width.toString().length)
          formatOptions.overflowCharacter = parseFormatChar(option)
          if (formatOptions.overflowCharacter === 'error') { formatError = true; break }
          if (formatOptions.overflowCharacter === '') { formatOptions.overflowCharacter = defaultOverflowCharacter }
          break
        case 'm':
        case 'M':
          const mantissa = parseInt(option || '')
          if (isNaN(mantissa) || !isFinite(mantissa)) { formatError = true; break }
          if (mantissa <= 0) { formatError = true; break }
          formatOptions.mantissa = mantissa
          break
        case 'f':
        case 'F':
          const decimals = parseInt(option || '')
          if (isNaN(decimals) || !isFinite(decimals)) { formatError = true; break }
          if (decimals < 0) { formatError = true; break }
          formatOptions.decimals = decimals
          break
        case 'c':
        case 'C':
          formatOptions.separatePlaces = true
          formatOptions.placeSeparator = parseFormatChar(option)
          break
        case 'd':
        case 'D':
          if (option.length <= 0) { formatError = true; break }
          formatOptions.decimalCharacter = parseFormatChar(option)
          break
        case 'z':
        case 'Z':
          formatOptions.leadingZeros = parseFormatChar(option)
          if (formatOptions.leadingZeros === 'error') { formatError = true; break }
          if (formatOptions.leadingZeros === '') { formatOptions.leadingZeros = '0' }
          break
        case 'c':
        case 'C':
          if (option.length <= 0) { formatError = true; break }
          const negative = option[0]
          if (negative !== ' ' && negative !== '+' && negative !== '(') { formatError = true; break }
          formatOptions.negativeMethod = negative
          break
        case 's':
        case 'S':
          formatOptions.negativeMethod = (option.length > 0) ? option[0] : option
          if (option !== '' && option !== ' ' && option !== '+' && option !== '(') { formatError = true; break }
          break
        case 'e':
        case 'E':
          if (option.length <= 0) { formatError = true; break }
          const scientific = option[0]
          if (scientific !== '0' && scientific !== '1' && scientific !== '2') { formatError = true; break }
          formatOptions.scientificNotation = parseInt(scientific)
          break
        default:
          formatError = true
          break
      }
    }
    if (formatError) {
      return error(ErrorCodes.ILLEGAL_VALUE, statement.parameters[1].tokenStart, statement.parameters[1].tokenEnd)
    }
    let mantissaString = ''
    let value = paramValues[0].value
    const sign = (value >= 0) ? 1 : -1
    value = value * sign
    let fracString = ''
    let placeGroupings = 3
    let placeSeparator = formatOptions.placeSeparator || ' '
    let decimals = 0
    let mantissaOverflow = false
    if (formatOptions.radix !== 10) {
      mantissaString = paramValues[0].value.toString(formatOptions.radix)
      placeGroupings = formatOptions.radix === 8 ? 3 : 4
      if (formatOptions.mantissa > 0) {
        if (mantissaString.length > formatOptions.mantissa) {
          mantissaString = formatOptions.overflowCharacter.repeat(formatOptions.mantissa)
        } else if (mantissaString.length < formatOptions.mantissa) {
          mantissaString = mantissaString.padStart(formatOptions.mantissa, '0')
        }
      }
    } else {
      placeSeparator = formatOptions.placeSeparator || defaultPlaceSeparator
      decimals = formatOptions.decimals
      const mantissa = Math.trunc(value)
      mantissaString = mantissa.toString()
      if (formatOptions.mantissa > 0 && mantissaString.length > formatOptions.mantissa) {
        mantissaOverflow = true
        mantissaString = formatOptions.overflowCharacter.repeat(formatOptions.mantissa)
      }
      let frac = value - mantissa
      if (decimals === 0) {
        fracString = ''
      } else if (frac > 0 && decimals > 0) {
        frac = Math.round(frac * 10**decimals)
        fracString = frac.toString()
      } else if (frac === 0 && decimals > 0) {
        fracString = '0'.repeat(decimals)
      } else {
        fracString = frac.toPrecision(normalPrecision).substring(2).replace(/0+$/, '')
      }
      if (mantissaOverflow) {
        fracString = formatOptions.overflowCharacter.repeat(fracString.length)
      }
    }
    let signWidth = formatOptions.negativeMethod === '(' ? 2 : ((formatOptions.negativeMethod === '' && sign > 0) ? 0 : 1)
    let numWidth = formatOptions.width === 0 ? 0 : formatOptions.width - signWidth
    // gap the mantissa string
    if (formatOptions.separatePlaces) {
      let gappedString = ''
      let gapCount = 0
      for (let i = mantissaString.length - 1; i >= 0; i--) {
        if (gapCount === placeGroupings) {
          gappedString = placeSeparator + gappedString
          gapCount = 0
        }
        gappedString = mantissaString[i] + gappedString
        gapCount += 1
      }
      mantissaString = gappedString
    }
    if (decimals > 0 || fracString !== '') {
      fracString = formatOptions.decimalCharacter + fracString
    }
    let numString = mantissaString + fracString
    let overflow = false
    if (formatOptions.scientificNotation === 1 || (formatOptions.scientificNotation === 2 && numWidth > 0 && numString.length > numWidth)) {
      let exp = Math.trunc(Math.log10(value))
      if (value < 1) { exp = exp - 1 }
      const expLen = exp.toString().length + 1 + ((exp >= 0) ? 1 : 0)
      const sciWidth = (numWidth === 0) ? 0 : (numWidth - expLen)
      value = (value * 10**(-exp))
      const frac = value - Math.trunc(value)
      if (frac === 0) {
        numString = value.toPrecision(2)
      } else {
        numString = value.toString().substring(0, sciWidth)
        numString = numString.replace(/0+$/, '')
      }
      if (sciWidth > 0 && sciWidth < 3) {
        overflow = true
      } else {
        numString = numString + 'e' + ((exp >= 0) ? '+' : '') + exp.toString()
      }
    } else if (numWidth > 0 && numString.length > numWidth) {
      overflow = true
    }
    if (!overflow && numWidth > 0 && numString.length < numWidth) {
      numString = numString.padStart(numWidth, formatOptions.leadingZeros)
    }
    if (overflow) {
      numString = formatOptions.overflowCharacter.repeat(formatOptions.width)
    } else if (mantissaOverflow) {
      numString = formatOptions.overflowCharacter + numString
    } else if (formatOptions.negativeMethod === '(') {
      let openSign = sign > 0 ? ' ' : '('
      let closeSign = sign > 0 ? ' ' : ')'
      numString = openSign + numString + closeSign
    } else if (formatOptions.radix === 10 && (formatOptions.negativeMethod !== '' || sign < 0)) {
      let signChar = sign > 0 ? (formatOptions.negativeMethod === '+' ? '+' : ' ') : '-'
      numString = signChar + numString
    }
    return Statement.strReturn(statement, numString)
  }
}
