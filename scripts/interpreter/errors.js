
const ErrorCodes = {
  BREAK: 'Break',
  CORRUPTED_SYSTEM: 'System Corruption. Execution Halted.',
  ILLEGAL_INDEX: 'Illegal Index',
  ILLEGAL_VALUE: 'Illegal Value',
  ILLEGAL_REASSIGN: 'Illegal Reassignment',
  INDEX_OUT_OF_BOUNDS: 'Index Out of Bounds',
  REDIM_ARRAY: 'Redimensioned Array',
  SYNTAX: 'Syntax Error',
  TOO_MANY_INPUTS: 'Too Many Inputs',
  TYPE_MISMATCH: 'Type Mismatch',
  UNCLOSED_PAREN: 'Unclosed Parentheses',
  UNDEF_FUNCTION: 'Undefined Function',
  UNDIM_ARRAY: 'Undimensioned Array',
  UNEXPECTED_NEXT: 'NEXT without FOR',
  UNKNOWN_LINE: 'Unknown Line',
  UNSUPPORTED: 'Unsupported Operation',
}

/* C64 errors for reference
BAD SUBSCRIPT
NEXT WITHOUT FOR
BREAK
NOT INPUT FILE
CAN'T CONTINUE
NOT OUTPUT FILE
DEVICE NOT PRESENT
OUT OF DATA
DIVISION BY ZERO
OUT OF MEMORY
FILE DATA
OVERFLOW
FILE NOT FOUND
REDIM'D ARRAY
FILE NOT OPEN
RETURN WITHOUT GOSUB
FILE OPEN
STRING TOO LONG
FORMULA TOO COMPLEX
SYNTAX
ILLEGAL DEVICE NUMBER
TOO MANY FILES
ILLEGAL DIRECT
TYPE MISMATCH
ILLEGAL QUANTITY
UNDEF'D FUNCTION
LOAD
UNDEF'D STATEMENT
MISSING FILENAME
VERIFY
 */

function error(errorCode, startLoc = -1, endLoc, sourceText) {
  if (!errorCode) { debug } // catch errors
  startLoc = startLoc || 0
  return { error: errorCode, location: startLoc, endLocation: endLoc || startLoc + 1, sourceText }
}

function errorat(errorCode, at, startLoc = -1, endLoc, sourceText) {
  return error(`${errorCode} ${at}`, startLoc, endLoc, sourceText)
}

function errorString(result) {
  return `ERROR: ${result.error}${result.location >= 0 ? ` at position ${result.location}` : ''}`
}

export {
  ErrorCodes,
  error,
  errorat,
  errorString
}
