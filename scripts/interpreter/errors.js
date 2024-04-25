
const ErrorCodes = {
  ILLEGAL_INDEX: 'Illegal Index',
  ILLEGAL_VALUE: 'Illegal Value',
  INDEX_OUT_OF_BOUNDS: 'Index Out of Bounds',
  REDIM_ARRAY: 'Redimensioned Array',
  SYNTAX: 'Syntax Error',
  TOO_MANY_INPUTS: 'Too Many Inputs',
  TYPE_MISMATCH: 'Type Mismatch',
  UNCLOSED_PAREN: 'Unclosed Parentheses',
  UNDIM_ARRAY: 'Undimensioned Array',
  UNSUPPORTED: 'Unsupported Operation',
}

function error(errorCode, startLoc, endLoc, sourceText) {
  if (!errorCode) { debug } // catch errors
  startLoc = startLoc || 0
  return { error: errorCode, location: startLoc, endLocation: endLoc || startLoc + 1, sourceText }
}

export {
  ErrorCodes,
  error
}
