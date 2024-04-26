import { ErrorCodes, error } from '../errors.js'

function unaryOperation(operator, value, expressionStart, expressionEnd) {
  if (value.valueType !== 'number') {
    return error(ErrorCodes.TYPE_MISMATCH, expressionStart, expressionEnd)
  }
  switch (operator.token) {
    case '-':
      value.value = -value.value
    case '+':
      break
    case 'BNOT':
      value.value = ~Math.trunc(value.value)
      break
    case 'NOT':
      value.value = (value.value === 0) ? 1 : 0
      break
    default:
      return error(ErrorCodes.UNSUPPORTED, operator.tokenStart, operator.tokenEnd)
  }
  if (isNaN(value.value) || !isFinite(value.value)) {
    return error(ErrorCodes.ILLEGAL_VALUE, expressionStart, expressionEnd)
  }
  return value
}

function binaryOperation(operator, preExpression, postExpression, interpreter) {
  const preValue = interpreter.interpretExpression(preExpression)
  if (preValue.error) { return preValue }
  // handle logical short-circuits
  if (operator.token === 'AND' && preValue.value === 0) {
    return { value: 0, valueType: 'number' }
  } else if (operator.token === 'OR' && preValue.value !== 0) {
    return { value: 1, valueType: 'number' }
  }
  const postValue = interpreter.interpretExpression(postExpression)
  if (postValue.error) { return postValue }
  if (preValue.valueType !== postValue.valueType) {
    return error(ErrorCodes.TYPE_MISMATCH, preExpression.tokenStart, postExpression.tokenEnd)
  }
  // string concat and compares -- do here to let rest be numeric math
  if (preValue.valueType === 'string') { // which means postValue type is string too
    if (operator.token === '+') {
      return {value: preValue.value + postValue.value, valueType: 'string'}
    } else if (operator.token === '=') {
      return { value: (preValue.value === postValue.value) ? 1 : 0, valueType: 'number' }
    } else if (operator.token === '<>') {
      return { value: (preValue.value !== postValue.value) ? 1 : 0, valueType: 'number' }
    }
  }
  // on with numerical math
  let value = null
  switch (operator.token) {
    case '^':
      value = preValue.value ** postValue.value
      break
    case '*':
      value = preValue.value * postValue.value
      break
    case '/':
      value = preValue.value / postValue.value
      break
    case 'DIV':
      value = Math.trunc(Math.trunc(preValue.value) / Math.trunc(postValue.value))
      break
    case 'MOD':
      value = Math.trunc(preValue.value) % Math.trunc(postValue.value)
      break
    case '+':
      value = preValue.value + postValue.value
      break
    case '-':
      value = preValue.value - postValue.value
      break
    case 'BAND':
      value = Math.trunc(preValue.value) & Math.trunc(postValue.value)
      break
    case 'AND':
      value = (preValue.value && postValue.value) ? 1 : 0
      break
    case 'BOR':
      value = Math.trunc(preValue.value) | Math.trunc(postValue.value)
      break
    case 'OR':
      value = (preValue.value || postValue.value) ? 1 : 0
      break
    case 'BXOR':
      value = Math.trunc(preValue.value) ^ Math.trunc(postValue.value)
      break
    case '=':
      value = (preValue.value === postValue.value) ? 1 : 0
      break
    case '<>':
      value = (preValue.value !== postValue.value) ? 1 : 0
      break
    case '>=':
      value = (preValue.value >= postValue.value) ? 1 : 0
      break
    case '<=':
      value = (preValue.value <= postValue.value) ? 1 : 0
      break
    case '>':
      value = (preValue.value > postValue.value) ? 1 : 0
      break
    case '<':
      value = (preValue.value < postValue.value) ? 1 : 0
      break
    default:
      return error(ErrorCodes.UNSUPPORTED, operator.tokenStart, operator.tokenEnd)
  }
  if (isNaN(value) || !isFinite(value)) {
    return error(ErrorCodes.ILLEGAL_VALUE, preExpression.tokenStart, postExpression.tokenEnd)
  }
  return { value, valueType: 'number' }
}

export {
  unaryOperation,
  binaryOperation
}