
const symbols = [
  { symbol: '^',             coding: 'binary-operator' },
  { symbol: '*',             coding: 'binary-operator' },
  { symbol: '/',             coding: 'binary-operator' },
  { symbol: '+',             coding: 'plus' },
  { symbol: '-',             coding: 'minus' },
  { symbol: '=',             coding: 'equal' },
  { symbol: '<>',            coding: 'binary-operator' },
  { symbol: '<=',            coding: 'binary-operator' },
  { symbol: '>=',            coding: 'binary-operator' },
  { symbol: '<',             coding: 'binary-operator' },
  { symbol: '>',             coding: 'binary-operator' },
  { symbol: '(',             coding: 'open-paren' },
  { symbol: ')',             coding: 'close-paren' },
  { symbol: ',',             coding: 'comma' },
  { symbol: ':',             coding: 'end-of-statement' },
  { symbol: ';',             coding: 'semicolon' }
]

const keywords = [
  { keyword: 'ABS',          coding: 'function' },
  { keyword: 'ASC',          coding: 'function' },
  { keyword: 'ANCHOR$',      coding: 'function' },
  { keyword: 'AND',          coding: 'binary-operator' },
  { keyword: 'ATN',          coding: 'function' },
  { keyword: 'AUTO',         coding: 'command' },
  { keyword: 'BEGIN',        coding: 'statement' },
  { keyword: 'BGND',         coding: 'print-function' },
  { keyword: 'BITMAP',       coding: 'keyword' },
  { keyword: 'BITMAP-FIXED', coding: 'keyword' },
  { keyword: 'BNOT',         coding: 'unary-operator' },
  { keyword: 'BORDER',       coding: 'statement' },
  { keyword: 'BREAK',        coding: 'statement' },
  { keyword: 'BUTTON$',      coding: 'function' },
  { keyword: 'CALL',         coding: 'function' },
  { keyword: 'CATALOG',      coding: 'command' },
  { keyword: 'CHORD$',       coding: 'function' },
  { keyword: 'CHR$',         coding: 'function' },
  { keyword: 'CLOSE',        coding: 'statement' },
  { keyword: 'CLRSCN',       coding: 'statement' },
  { keyword: 'COLOR',        coding: 'statement' },
  { keyword: 'CONT',         coding: 'command' },
  { keyword: 'COS',          coding: 'function' },
  { keyword: 'CTRPAD$',      coding: 'function' },
  { keyword: 'DATA',         coding: 'statement' },
  { keyword: 'DATE$',        coding: 'function' },
  { keyword: 'DATE',         coding: 'function' },
  { keyword: 'DEBUG',        coding: 'command' },
  { keyword: 'DEF',          coding: 'statement' },
  { keyword: 'DLOAD',        coding: 'statement' },
  { keyword: 'DRAW',         coding: 'statement' },
  { keyword: 'DSAVE',        coding: 'statement ' },
  { keyword: 'DIM',          coding: 'statement' },
  { keyword: 'DIV',          coding: 'binary-operator' },
  { keyword: 'DUMP',         coding: 'command' },
  { keyword: 'EDIT',         coding: 'command' },
  { keyword: 'ELLIPSE',      coding: 'statement' },
  { keyword: 'ELSE',         coding: 'statement' },
  { keyword: 'END',          coding: 'statement' }, // also keyword
  { keyword: 'ENDIF',        coding: 'statement' },
  { keyword: 'EXIST',        coding: 'function' },
  { keyword: 'EXP',          coding: 'function' },
  { keyword: 'FGND',         coding: 'print-function' },
  { keyword: 'FILL',         coding: 'statement' },
  { keyword: 'FIND',         coding: 'command' },
  { keyword: 'FIXED',        coding: 'keyword' },
  { keyword: 'FN',           coding: 'function' },
  { keyword: 'FONT',         coding: 'statement' },
  { keyword: 'FOR',          coding: 'statement' },
  { keyword: 'FRAC',         coding: 'function' },
  { keyword: 'GET',          coding: 'statement' },
  { keyword: 'GETKEY',       coding: 'statement' },
  { keyword: 'GETSCR$',      coding: 'function' },
  { keyword: 'GOCHROME',     coding: 'command' },
  { keyword: 'GOSUB',        coding: 'statement' },
  { keyword: 'GOTO',         coding: 'statement' },
  { keyword: 'HTMLCHR$',     coding: 'function' },
  { keyword: 'HTMLSAFE$',    coding: 'function' },
  { keyword: 'HTMLTAG',      coding: 'statement' },
  { keyword: 'HTML',         coding: 'keyword' },
  { keyword: 'ID',           coding: 'keyword' },
  { keyword: 'IF',           coding: 'statement' },
  { keyword: 'IMAGE',        coding: 'statement' },
  { keyword: 'INPUT',        coding: 'statement' },
  { keyword: 'INSTR',        coding: 'function' },
  { keyword: 'INT',          coding: 'function' },
  { keyword: 'ISCHILD',      coding: 'function' },
  { keyword: 'JOY',          coding: 'function' },
  { keyword: 'KEY$',         coding: 'function' },
  { keyword: 'KEY',          coding: 'statement' },
  { keyword: 'LABEL',        coding: 'statement' },
  { keyword: 'LEFT$',        coding: 'function' },
  { keyword: 'LEN',          coding: 'function' },
  { keyword: 'LET',          coding: 'statement' },
  { keyword: 'LINK$',        coding: 'function' },
  { keyword: 'LIST',         coding: 'command' },
  { keyword: 'LIVE',         coding: 'command' },
  { keyword: 'LOAD',         coding: 'command' },
  { keyword: 'LOCAL',        coding: 'statement' },
  { keyword: 'LOG',          coding: 'function' },
  { keyword: 'LOG10',        coding: 'function' },
  { keyword: 'LPAD$',        coding: 'function' },
  { keyword: 'MID$',         coding: 'function' },
  { keyword: 'MOD',          coding: 'binary-operator' },
  { keyword: 'NEXT',         coding: 'statement' },
  { keyword: 'NEW',          coding: 'command' },
  { keyword: 'NOT',          coding: 'unary-operator' },
  { keyword: 'OFF',          coding: 'keyword' },
  { keyword: 'ON',           coding: 'statement' },
  { keyword: 'ONCLICK',      coding: 'statement' },
  { keyword: 'ONSPRCOL',     coding: 'statement' },
  { keyword: 'ONTOUCH',      coding: 'statement' },
  { keyword: 'OPEN',         coding: 'function' },
  { keyword: 'OR',           coding: 'binary-operator' },
  { keyword: 'PARAMS',       coding: 'statement' },
  { keyword: 'PATCH$',       coding: 'function' },
  { keyword: 'PI',           coding: 'function' },
  { keyword: 'PLAY',         coding: 'statement' },
  { keyword: 'POS',          coding: 'print-function' },
  { keyword: 'PRINT',        coding: 'statement' },
  { keyword: 'PUTSCR',       coding: 'statement' },
  { keyword: 'READ',         coding: 'statement' },
  { keyword: 'READC',        coding: 'function' },
  { keyword: 'READLN$',      coding: 'function' },
  { keyword: 'RECT',         coding: 'statement' },
  { keyword: 'REM',          coding: 'remark' },
  { keyword: 'RENUMBER',     coding: 'command' },
  { keyword: 'RESTORE',      coding: 'statement' },
  { keyword: 'RESUME',       coding: 'statement' },
  { keyword: 'RETURN',       coding: 'statement' },
  { keyword: 'RIGHT$',       coding: 'function' },
  { keyword: 'RND',          coding: 'function' },
  { keyword: 'RPAD$',        coding: 'function' },
  { keyword: 'RPT$',         coding: 'function' },
  { keyword: 'RUN',          coding: 'command' },
  { keyword: 'SAVE',         coding: 'command' },
  { keyword: 'SCREEN',       coding: 'statement' },
  { keyword: 'SCRDIM',       coding: 'function' },
  { keyword: 'SCROLL',       coding: 'keyword' },
  { keyword: 'SCROLLPOS',    coding: 'function' },
  { keyword: 'SCROLLTO',     coding: 'statement' },
  { keyword: 'SEQUENCE$',    coding: 'function' },
  { keyword: 'SGN',          coding: 'function' },
  { keyword: 'SIN',          coding: 'function' },
  { keyword: 'SLEEP',        coding: 'statement' },
  { keyword: 'SLOW',         coding: 'command' },
  { keyword: 'SOUND$',       coding: 'function' },
  { keyword: 'SPRDEF',       coding: 'statement' },
  { keyword: 'SPRDIM',       coding: 'function' },
  { keyword: 'SPRMOV',       coding: 'statement' },
  { keyword: 'SPRPOS',       coding: 'function' },
  { keyword: 'SPRSHOW',      coding: 'statement' },
  { keyword: 'SQR',          coding: 'function' },
  { keyword: 'STEP',         coding: 'keyword' },
  { keyword: 'STOP',         coding: 'statement' },
  { keyword: 'STR$',         coding: 'function' },
  { keyword: 'STYLE',        coding: 'statement' },
  { keyword: 'TAB',          coding: 'print-function' },
  { keyword: 'TAN',          coding: 'function' },
  { keyword: 'TEMPO',        coding: 'statement' },
  { keyword: 'THEN',         coding: 'keyword' },
  { keyword: 'TIME$',        coding: 'function' },
  { keyword: 'TIME',         coding: 'function' },
  { keyword: 'TIMESTAMP$',   coding: 'function' },
  { keyword: 'TIMESTAMP',    coding: 'function' },
  { keyword: 'TO',           coding: 'keyword' },
  { keyword: 'TOUCHPOS',     coding: 'function' },
  { keyword: 'TRAP',         coding: 'statement' },
  { keyword: 'TRASH',        coding: 'command' },
  { keyword: 'UNICODE$',     coding: 'function' },
  { keyword: 'VAL',          coding: 'function' },
  { keyword: 'VAR',          coding: 'keyword' },
  { keyword: 'VOICE',        coding: 'statement' },
  { keyword: 'VOLUME',       coding: 'statement' },
  { keyword: 'WAIT',         coding: 'statement' },
  { keyword: 'WINDIM',       coding: 'function' },
  { keyword: 'WINDOW',       coding: 'statement' },
  { keyword: 'WRITEC',       coding: 'statement' },
  { keyword: 'WRITELN',      coding: 'statement' },
  { keyword: 'XOR',          coding: 'binary-operator' }
]

export default function nextToken(restOfLine, tokenStart) {
  const startOfLine = (tokenStart === 0)
  const trimmedLine = restOfLine.trimStart()
  tokenStart += restOfLine.length - trimmedLine.length
  restOfLine = trimmedLine
  let tokenEnd = tokenStart

  if (restOfLine.trim().length === 0) {
    return { token: 'eol', coding: 'end-of-statement', restOfLine: null, tokenStart, tokenEnd }
  }

  if (startOfLine && "0123456789".indexOf(restOfLine[0]) >= 0) {
    tokenEnd = restOfLine.search(/\D+/)
    return { token: restOfLine.substring(0, tokenEnd), coding: 'line-number', restOfLine: restOfLine.substring(tokenEnd), tokenStart, tokenEnd }
  }

  // check for standalone symbols
  for (const symbolDef of symbols) {
    const symbol = symbolDef.symbol
    if (restOfLine.startsWith(symbol)) {
      restOfLine = restOfLine.substring(symbol.length)
      tokenEnd += symbol.length
      return { token: symbol, coding: symbolDef.coding, restOfLine, tokenStart, tokenEnd }
    }
  }

  const leadChar = restOfLine[0]
  restOfLine = restOfLine.substring(1)
  tokenEnd += 1

  // check for quoted string
  if (leadChar === '"') {
    return parseStringLiteral(restOfLine, tokenStart, tokenEnd)
  }

  // check for number
  if (".0123456789".indexOf(leadChar) >= 0) {
    return parseNumberLiteral(leadChar, restOfLine, tokenStart, tokenEnd)
  }

  // check for variable name
  if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(leadChar.toUpperCase())>= 0) {
    return parseVariableNameOrKeyword(leadChar, restOfLine, tokenStart, tokenEnd)
  }

  // fall through to error case
  return { token: leadChar, coding: 'char', restOfLine, tokenStart, tokenEnd: tokenEnd + 1, error: `Unexpected ${leadChar}` }
}

function parseStringLiteral(restOfLine, tokenStart, tokenEnd) {
  let str = ''
  let strDone = false
  while (!strDone) {
    let endStrLen = restOfLine.indexOf('"')
    if (endStrLen < 0) {
      str += restOfLine
      tokenEnd += restOfLine.length
      restOfLine = ''
      strDone = true
    } else if (endStrLen < restOfLine.length - 1 && restOfLine[endStrLen + 1] === '"') {
      const substr = restOfLine.substring(0, endStrLen)
      str += substr + '"'
      tokenEnd += substr.length + 2
      restOfLine = restOfLine.substring(substr.length + 2) // skip ahead of double double-quote
    } else {
      str += restOfLine.substring(0, endStrLen)
      tokenEnd += str.length + 1
      restOfLine = restOfLine.substring(endStrLen + 1)
      strDone = true
    }
  }
  return { token: str, coding: 'string-literal', restOfLine, tokenStart, tokenEnd }
}

function parseNumberLiteral(leadChar, restOfLine, tokenStart, tokenEnd) {
  let hasDecimal = (leadChar === '.')
  let inExponent = false
  let exponentWasPrev = false
  let numDone = false
  let numStr = leadChar
  while (!numDone && restOfLine.length > 0) {
    const nextChar = restOfLine[0]
    if (".0123456789E+-".indexOf(nextChar) >= 0) {
      if (nextChar === '.' && hasDecimal) {
        numDone = true
      } else if (nextChar === 'E' || nextChar === 'e') {
        if (inExponent) {
          numDone = true
        } else if (restOfLine.length === 1 || "0123456789+-".indexOf(restOfLine[1]) < 0) {
          numDone = true
        } else if (restOfLine[1] === '+' || restOfLine[1] === "-" && (restOfLine.length === 2 || "0123456789".indexOf(restOfLine[2]) < 0)) {
          numDone = true
        } else {
          inExponent = true
          exponentWasPrev = true
        }
      } else if ((nextChar === '+' || nextChar === '-') && !exponentWasPrev) {
        numDone = true
      } else if (exponentWasPrev) {
        exponentWasPrev = false
      }
    } else {
      numDone = true
    }
    if (!numDone) {
      numStr += nextChar
      tokenEnd += 1
      restOfLine = restOfLine.substring(1)
    }
  }
  return { token: numStr, coding: 'number-literal', restOfLine, tokenStart, tokenEnd }
}

function parseVariableNameOrKeyword(leadChar, restOfLine, tokenStart, tokenEnd) {
  let varName = leadChar
  let varDone = false
  let gotType = false
  while (!varDone && restOfLine.length > 0) {
    const nextChar = restOfLine[0]
    if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$%".indexOf(nextChar.toUpperCase()) >= 0) {
      if (nextChar === '$' || nextChar === '%') {
        gotType = true
      }
    } else {
      varDone = true
    }
    if (!varDone) {
      varName += nextChar
      tokenEnd += 1
      restOfLine = restOfLine.substring(1)
      if (gotType) {
        varDone = true
      }
    }
  }
  // check for keyword
  const upperVarName = varName.toUpperCase()
  for (const keywordDef of keywords) {
    const keyword = keywordDef.keyword
    if (upperVarName === keyword) {
      return { token: keyword, coding: keywordDef.coding, restOfLine, tokenStart, tokenEnd }
    }
  }
  let coding = 'variable-number'
  if (varName.endsWith('$')) {
    coding = 'variable-string'
  } else if (varName.endsWith('%')) {
    coding = 'variable-integer'
  }
  return { token: varName, coding, restOfLine, tokenStart, tokenEnd }
}
