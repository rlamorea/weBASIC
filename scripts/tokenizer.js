
const keywords = [
  { keyword: 'PRINT', type: 'statement' },
]

funtion nextToken(restOfLine, tokenStart) {
  restOfLine = restOfLine.trimStart()
  let tokenEnd = tokenStart

  if (restOfLine.trim() === 0) {
    return { token: null, coding: 'eol', restOfLine: null, tokenEnd: tokenEnd }
  }

  // check for command
  ucRestOfLine = restOfLine.toUpperCase()
  for (const keywordDef of keywords) {
    const keyword = keywordDef.keyword
    if (ucRestOfLine.startsWith(keyword)) {
      tokenEnd += keyword.length
      return { token: keyword, coding: keywordDef.type, restOfLine: restOfLine.substring(keyword.length), tokenEnd: tokenEnd }
    }
  }

  // check for quoted string
  const leadChar = restOfLine[0]
  restOfLine = restOfLine.substring(1)

  if (restOfLine.startsWith('"')) {
    let str = ''
    let strDone = false
    tokenEnd += 1
    while (!strDone) {
      let endStrLen = restOfLine.indexOf('"')
      if (endStrLen < 0) {
        str += restOfLine
        tokenEnd += restOfLine.length
        restOfLine = ''
        strDone = true
      } else if (endStrLen < restOfLine.length - 1 && restOfLine[endStrLen + 1] === '"') {
        str += restOfLine.substring(0, endStrLen) + '"'
        tokenEnd += restOfLine.length + 2
        restOfLine = restOfLine.substring(2) // skip ahead of double double-quote
      } else {
        str += restOfLine.substring(0, endStrLen)
        tokenEnd += restOfLine.length + 1
        restOfLine = restOfLine.substring(endStrLen + 1)
        strDone = true
      }
    }
    return { token: str, coding: 'string-literal', restOfLine: restOfLine, tokenEnd: tokenEnd }
  }

  // fall through to error case
  return { token: leadChar, coding: 'char', restOfLine: restOfLine, tokenEnd: tokenEnd + 1, error: 'Unexpected character' }
}
