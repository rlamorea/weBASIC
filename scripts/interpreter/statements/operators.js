
function unaryOperation(operator, value, expressionStart, expressionEnd) {
  if (value.valueType !== 'number') {
    return { error: 'Type Mismatch', location: expressionStart, endLocation: expressionEnd }
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
      return { error: `Unknown Operator ${operator.token}`, location: operator.tokenStart, endLocation: operator.tokenEnd }
  }
  if (isNaN(value.value) || !isFinite(value.value)) {
    return { error: `Illegal Value`, location: expressionStart, endLocation: expressionEnd }
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
    return { error: 'Type Mismatch', location: preExpression.tokenStart, endLocation: postExpression.tokenEnd }
  }
  // string concat -- do here to let rest be numeric math
  if (operator.token === '+' && preValue.valueType === 'string') { // which means postValue type is string too
    return { value: preValue.value + postValue.value, valueType: 'string' }
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
      return { error: `Unknown Operator ${operator.token}`, location: operator.tokenStart, endLocation: operator.tokenEnd }
  }
  if (isNaN(value) || !isFinite(value)) {
    return { error: 'Invalid Expression', location: preExpression.tokenStart, endLocation: postExpression.tokenEnd }
  }
  return { value, valueType: 'number' }
}

export {
  unaryOperation,
  binaryOperation
}