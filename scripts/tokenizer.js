
const keywords = [
  { keyword: 'PRINT', coding: 'statement' },
]

export default function nextToken(restOfLine, tokenStart) {
  const trimmedLine = restOfLine.trimStart()
  tokenStart += restOfLine.length - trimmedLine.length
  restOfLine = trimmedLine
  let tokenEnd = tokenStart

  if (restOfLine.trim().length === 0) {
    return { token: 'eol', coding: 'end-of-statement', restOfLine: null, tokenStart, tokenEnd }
  }

  // check for keyword
  const ucRestOfLine = restOfLine.toUpperCase()
  for (const keywordDef of keywords) {
    const keyword = keywordDef.keyword
    if (ucRestOfLine.startsWith(keyword)) {
      restOfLine = restOfLine.substring(keyword.length)
      tokenEnd += keyword.length
      return { token: keyword, coding: keywordDef.coding, restOfLine, tokenStart, tokenEnd }
    }
  }

  // check for quoted string
  const leadChar = restOfLine[0]
  restOfLine = restOfLine.substring(1)

  if (leadChar === '"') {
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

  // fall through to error case
  return { token: leadChar, coding: 'char', restOfLine, tokenStart, tokenEnd: tokenEnd + 1, error: `Unexpected ${leadChar}` }
}
