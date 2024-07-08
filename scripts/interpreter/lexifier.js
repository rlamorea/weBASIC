import nextToken from './tokenizer.js'
import * as Statements from './statements/statements.js'
import { ErrorCodes, error } from './errors.js'

const prioritizedOperators = [
  '^', '*', '/', 'DIV', 'MOD', '+', '-',
  'BAND', 'BOR', 'BXOR',
  '=', '<>', '>=', '<=', '>', '<',
  'AND', 'OR'
]

const keywordCodings = [ 'keyword', 'function', 'statement', 'command', 'binary-operator', 'unary-operator' ]

export default class Lexifier {
  constructor() {
    this.specialHandlers = { }
    for (const statement in Statements) {
      Statements[statement].addLexicalHandlers(this.specialHandlers)
    }
  }

  identifyCleanTokens(codeLine) {
    let tokenStart = 0
    let cleanTokens = []
    let lineNumber = null
    let nonLineNumberTokens = 0
    while (1 === 1) {
      const tokenDef = nextToken(codeLine, tokenStart)
      if (tokenDef.restOfLine === null) { break }
      if (tokenDef.coding === 'line-number') {
        lineNumber = tokenDef
      } else {
        nonLineNumberTokens += 1
      }
      if (keywordCodings.includes(tokenDef.coding)) {
        cleanTokens.push({
          start: tokenDef.tokenStart,
          end: tokenDef.tokenEnd,
          replace: tokenDef.token
        })
      }
      tokenStart = tokenDef.tokenEnd
      codeLine = tokenDef.restOfLine
    }
    return { cleanTokens, lineNumber, emptyLine: (nonLineNumberTokens === 0) }
  }

  cleanCodeLine(code, cleanTokens) {
    for (const token of cleanTokens) {
      const pre = (token.start === 0) ? '' : code.substring(0, token.start)
      const post = (token.end === code.length - 1) ? '' : code.substring(token.end)
      code = pre + token.replace + post
    }
    return code
  }

  lexifyLine(codeLine, allowLineNumbers = false, acceptedList = null) {
    // parse line to first end-of-statement (LIVE only for now)
    let lineStatements = []
    let statementTokens = []
    let tokenStart = 0
    let commandLine = null
    let lineNumber = null
    let acceptedCommand = false
    let errorEncountered = null
    while (1 === 1) {
      let tokenDef = nextToken(codeLine, tokenStart)
      if (tokenDef.error) {
        errorEncountered = tokenDef
        break
      }
      if (allowLineNumbers && tokenStart === 0 && tokenDef.coding === 'line-number') {
        lineNumber = parseInt(tokenDef.token)
        if (isNaN(lineNumber) || !isFinite(lineNumber)) {
          errorEncountered = error(ErrorCodes.ILLEGAL_LINE, tokenDef.tokenStart, tokenDef.tokenEnd)
          break
        }
      } else if (tokenDef.coding === 'line-number') {
        errorEncountered = error('unexpected-line-number', tokenDef.tokenStart, tokenDef.tokenEnd)
        break
      } else if (tokenDef.coding === 'command' && (lineNumber || tokenStart !== 0)) {
        errorEncountered = error(ErrorCodes.ILLEGAL_COMMAND, tokenDef.tokenStart, tokenDef.tokenEnd)
        break
      } else if (tokenDef.coding === 'end-of-statement') {
        if (commandLine && lineStatements.length > 0) {
          errorEncountered = error(ErrorCodes.ILLEGAL_COMMAND, tokenDef.tokenStart, tokenDef.tokenEnd)
          break
        }
        const result = this.lexifyStatement(statementTokens, lineNumber)
        if (result.error) {
          errorEncountered = result
          break
        }
        result.lineNumber = lineNumber
        lineStatements.push(result)
        if (result.ignoreRestOfLine) {
          break
        }
        statementTokens = []
        acceptedCommand = false
      } else {
        if (acceptedList && !acceptedCommand) {
          let tokenIdx = acceptedList.indexOf(`${tokenDef.coding}|${tokenDef.token}`)
          if (tokenIdx < 0) { tokenIdx = acceptedList.indexOf(`${tokenDef.coding}|*`) }
          if (tokenIdx < 0) {
            errorEncountered = error(ErrorCodes.NOT_ALLOWED, tokenDef.tokenStart, tokenDef.tokenEnd)
            break
          }
          acceptedCommand = true
        }
        statementTokens.push(tokenDef)
      }
      if (tokenDef.coding === 'command') { commandLine = tokenDef }
      if (tokenDef.restOfLine === null) { break }
      codeLine = tokenDef.restOfLine
      tokenStart = tokenDef.tokenEnd
    }
    let result = { lineStatements, lineNumber }
    if (errorEncountered) { result = { ...result, ...errorEncountered } }
    return result
  }

  lexifyStatement(statementTokens, lineNumber) {
    if (statementTokens.length === 0) return { coding: 'empty' }
    const firstToken = statementTokens.shift()
    firstToken.lineNumber = lineNumber
    // there are two types of execution statements:
    if (firstToken.coding.startsWith('variable-')) { // assignments
      return this.lexifyAssignment(firstToken, statementTokens)
    } else if (firstToken.coding === 'command' || firstToken.coding === 'statement' || firstToken.coding === 'remark') {
      return this.lexifyCommandOrStatement(firstToken, statementTokens, lineNumber)
    } else {
      return error(ErrorCodes.SYNTAX, firstToken.tokenStart, firstToken.tokenEnd)
    }
  }

  lexifyAssignment(variable, tokens) {
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, variable.tokenStart, variable.tokenEnd)
    }
    let token = tokens.shift()
    const result = this.parseVariableDimensions(variable, token, tokens)
    if (result.error) { return result }
    tokens = result.restOfTokens
    if (result.foundDimensions) {
      if (tokens.length === 0) {
        return error(ErrorCodes.SYNTAX, variable.tokenEnd, token.tokenEnd + 1)
      }
      token = tokens.shift()
    }
    if (token.coding !== 'equal') {
      return error(ErrorCodes.SYNTAX, token.tokenStart, token.tokenEnd)
    }
    if (tokens.length === 0) {
      return error(ErrorCodes.SYNTAX, variable.tokenEnd, token.tokenEnd + 1)
    }
    const expression = this.parseExpression(tokens, tokens[0].tokenStart)
    if (expression.error) { return expression }
    if (expression.valueType !== 'any' && expression.valueType !== variable.valueType) {
      return error(ErrorCodes.TYPE_MISMATCH,expression.tokenStart, expression.tokenEnd)
    }
    return { coding: 'assignment', variable: variable, value: expression }
  }

  lexifyCommandOrStatement(statement, tokens) {
    let handler = this.specialHandlers[`${statement.coding}|${statement.token}`]
    if (!handler) {
      handler = this.specialHandlers[`${statement.coding}*`]
    }
    if (handler) {
      return handler(statement, tokens, this)
    } else {
      const tokenStart = tokens.length === 0 ? statement.tokenEnd : tokens[0].tokenStart
      const params = this.parseIntoParameters(tokens, tokenStart)
      if (params.error) { return params }
      statement.parameters = params.parameters
      return statement
    }
  }

  parseVariableDimensions(variable, testToken, tokens) {
    let restOfTokens = tokens
    let foundDimensions = false
    if (testToken.coding === 'open-paren') {
      const dimension = this.parseToCloseParen(tokens, testToken.tokenStart)
      if (dimension.error) { return dimension }
      if (dimension.parenTokens.length === 0) {
        return error(ErrorCodes.ILLEGAL_INDEX, token.tokenStart, dimension.tokenEnd)
      }
      const dimensionParams = this.parseIntoParameters(dimension.parenTokens, dimension.parenTokens[0].tokenStart)
      if (dimensionParams.error) { return dimensionParams }
      variable.dimension = dimensionParams.parameters
      restOfTokens = dimension.restOfTokens
      foundDimensions = true
    }
    return { restOfTokens, foundDimensions }
  }

  parseToToken(targetCoding, tokens, tokenStart, notFoundError, targetToken) {
    const eosOk = !(notFoundError)
    let insideTokens = []
    let tokenEnd = tokenStart + 1
    let closeToken = null
    while (1 === 1) {
      if (tokens.length === 0) {
        if (!eosOk) { return error(notFoundError, tokenStart, tokenEnd) }
        break
      }
      const token = tokens.shift()
      if (token.coding === 'open-paren') {
        insideTokens.push(token)
        const result = this.parseToCloseParen(tokens, token.tokenStart)
        if (result.error) { return result }
        insideTokens.push(...result.parenTokens) // flatten back out for later
        insideTokens.push(result.closeParen) // put close paren back
        tokens = result.restOfTokens
      } else if (token.coding === targetCoding && (!targetToken || token.token === targetToken)) {
        closeToken = token
        tokenEnd = token.tokenEnd
        break
      } else if (token.coding === 'end-of-statement') {
        tokens = [] // force end
      } else {
        insideTokens.push(token)
      }
    }
    return { insideTokens: insideTokens, restOfTokens: tokens, tokenEnd, closeToken }
  }

  parseToCloseParen(tokens, tokenStart) {
    let result = this.parseToToken('close-paren', tokens, tokenStart, ErrorCodes.UNCLOSED_PAREN)
    if (result.error) { return result }
    result.parenTokens = result.insideTokens
    result.closeParen = result.closeToken
    return result
  }

  parseIntoParameters(tokens, tokenStart, noExpression = false) {
    let paramTokens = []
    let params = []
    let tokenEnd = tokenStart
    while (1 === 1) {
      if (tokens.length === 0) {
        if (paramTokens.length > 0) {
          if (noExpression) {
            params.push(paramTokens)
          } else {
            const expression = this.parseExpression(paramTokens, paramTokens[0].tokenStart)
            if (expression.error) { return expression }
            params.push(expression)
          }
        }
        return { parameters: params, restOfTokens: tokens, tokenEnd }
      }
      const token = tokens.shift()
      if (token.coding === 'comma') {
        if (noExpression) {
          params.push(paramTokens)
        } else {
          if (paramTokens.length === 0) {
            return error(ErrorCodes.ILLEGAL_VALUE, token.tokenStart, token.tokenEnd)
          }
          const expression = this.parseExpression(paramTokens, paramTokens[0].tokenStart)
          if (expression.error) { return expression }
          params.push(expression)
        }
        tokenStart = token.tokenStart
        paramTokens = []
      } else if (token.coding === 'open-paren') {
        paramTokens.push(token)
        const result = this.parseToCloseParen(tokens, token.tokenStart)
        if (result.error) { return result }
        paramTokens.push(...result.parenTokens) // flatten back out for later
        paramTokens.push(result.closeParen) // put close paren back
        tokens = result.restOfTokens
      } else if (token.coding === 'end-of-statement') {
        tokens = []
      } else {
        paramTokens.push(token)
      }
      tokenEnd = token.tokenEnd
    }
  }

  parseTokensUntil(tokens, stopTokens) {
    if (!Array.isArray(stopTokens)) { stopTokens = [ stopTokens ] }
    const parsedTokens = []
    while (tokens.length > 0) {
      const token = tokens.shift()
      const tokenKey = `${token.coding}|${token.token}`
      if (stopTokens.indexOf(tokenKey) >= 0) {
        tokens.unshift(token)
        break
      }
      parsedTokens.push(token)
    }
    return { parsedTokens, restOfTokens: tokens }
  }

  parseExpression(tokens, tokenStart) {
    let clauseTokens = []
    let tokenEnd = tokenStart
    let unaryOperator = null
    let hasNumbers = false
    let hasStrings = false
    let needOperator = false
    let prevVariable = null
    while (1 === 1) {
      if (tokens.length === 0) {
        if (clauseTokens.length === 0 || !needOperator) {
          return error(ErrorCodes.SYNTAX, tokenStart, tokenEnd)
        }
        const lastClause = clauseTokens.slice(-1)[0]
        if (unaryOperator) { lastClause.unaryOperator = unaryOperator }
        break
      }
      let token = tokens.shift()
      tokenEnd = token.tokenEnd
      if (token.coding === 'end-of-statement') {
        tokens = [] // push to end
      } else if (token.coding === 'open-paren' && prevVariable) {
        const result = this.parseVariableDimensions(prevVariable, token, tokens)
        if (result.error) { return result }
        prevVariable = null
        tokens = result.restOfTokens
      } else if (needOperator && [ 'plus', 'minus', 'equal', 'binary-operator' ].indexOf(token.coding) < 0) {
        return error(ErrorCodes.SYNTAX, token.tokenStart, tokenEnd)
      } else if (!needOperator && [ 'plus', 'minus', 'unary-operator' ].indexOf(token.coding) >= 0) {
        unaryOperator = { token: token.token, coding: 'unary-operator', tokenStart: token.tokenStart, tokenEnd: token.tokenEnd }
      } else if (token.coding === 'function') {
        prevVariable = null
        if (tokens.length === 0) {
          return error(ErrorCodes.SYNTAX, token.tokenStart, tokenEnd)
        }
        if (hasNumbers && token.valueType === 'string') {
          return error(ErrorCodes.TYPE_MISMATCH, token.tokenStart, tokenEnd)
        } else if (hasStrings && token.valueType === 'number') {
          return error(ErrorCodes.TYPE_MISMATCH, token.tokenStart, tokenEnd)
        }
        const functionDef = token
        const handler = this.specialHandlers[`${token.coding}|${token.token}`]
        if (handler) {
          const result = handler(token, tokens, this)
          if (result.error) { return result }
          clauseTokens.push(result)
          tokens = result.restOfTokens
        } else {
          token = tokens.shift()
          if (token.coding !== 'open-paren') {
            return error(ErrorCodes.SYNTAX, token.tokenStart, token.tokenEnd)
          }
          const parenTokens = this.parseToCloseParen(tokens, tokenEnd)
          if (parenTokens.error) {
            return parenTokens
          }
          tokens = parenTokens.restOfTokens
          tokenEnd = parenTokens.tokenEnd
          const params = this.parseIntoParameters(parenTokens.parenTokens, tokenStart)
          if (params.error) { return params }
          clauseTokens.push({
            coding: 'function',
            function: functionDef,
            parameters: params.parameters,
            valueType: functionDef.valueType,
            tokenStart: functionDef.tokenStart,
            tokenEnd
          })
        }
        hasStrings = (functionDef.valueType === 'string')
        hasNumbers = (functionDef.valueType === 'number')
        needOperator = true
      } else if (token.coding === 'open-paren') {
        prevVariable = null
        const parenTokens = this.parseToCloseParen(tokens, tokenEnd)
        if (parenTokens.error) { return parenTokens }
        if (parenTokens.length === 0) {
          return error(ErrorCodes.SYNTAX, tokenEnd, tokenEnd + 1)
        }
        tokens = parenTokens.restOfTokens
        if (parenTokens.parenTokens.length === 0) {
          return error(ErrorCodes.SYNTAX, tokenStart, tokenEnd)
        }
        const subExpression = this.parseExpression(parenTokens.parenTokens, parenTokens.parenTokens[0].tokenStart)
        if (subExpression.error) { return subExpression }
        // Commented out -- I think there is no need for a paren-group, the calculation will do the encapsulation trick
        //clauseTokens.push({ expression: subExpression, coding: 'paren-group', tokenStart, tokenEnd })
        clauseTokens.push(subExpression)
        needOperator = true
      } else if (token.coding === 'string-literal' || token.coding === 'variable-string') {
        prevVariable = null
        if (unaryOperator || hasNumbers) {
          return error(ErrorCodes.TYPE_MISMATCH, token.tokenStart, tokenEnd)
        }
        clauseTokens.push(token)
        hasStrings = true
        needOperator = true
        if (token.coding === 'variable-string') { prevVariable = token }
      } else if (token.coding === 'number-literal' || token.coding === 'variable-number' || token.coding === 'variable-integer') {
        prevVariable = null
        if (hasStrings) {
          return error(ErrorCodes.TYPE_MISMATCH, token.tokenStart, tokenEnd)
        }
        clauseTokens.push(token)
        hasNumbers = true
        needOperator = true
        if (token.coding.startsWith('variable-')) { prevVariable = token }
      } else if (needOperator && [ 'plus', 'minus', 'equal', 'binary-operator' ].indexOf(token.coding) >= 0) {
        prevVariable = null
        if (hasStrings && !(token.coding === 'plus' || token.coding === 'equal' || token.token === '<>')) {
          return error(ErrorCodes.TYPE_MISMATCH, token.tokenStart, tokenEnd)
        }
        const lastClause = clauseTokens.slice(-1)[0]
        if (unaryOperator) { lastClause.unaryOperator = unaryOperator }
        clauseTokens.push({ token: token.token, coding: 'binary-operator', tokenStart: token.tokenStart, tokenEnd })
        needOperator = false
        unaryOperator = null
      } else {
        return error(ErrorCodes.SYNTAX, token.tokenStart, tokenEnd)
      }
    }
    return this.prioritizeExpression(clauseTokens)
  }

  prioritizeExpression(clauses) {
    if (clauses.length === 1) { return clauses[0] }
    for (const operator of prioritizedOperators) {
      let didCalc = false
      do {
        didCalc = false
        for (let idx = clauses.length - 1; idx > 0; idx--) {
          const clause = clauses[idx]
          if (clause.coding === 'binary-operator' && clause.token === operator) {
            const pre = clauses[idx - 1]
            const post = clauses[idx + 1]
            const valueType = (pre.valueType === 'any' || post.valueType === 'any') ? 'any' : pre.valueType
            const replacementClause = {
              coding: 'calculation',
              pre,
              operator: clause,
              post,
              tokenStart: clauses[idx - 1].tokenStart,
              tokenEnd: clauses[idx + 1].tokenEnd,
              valueType
            }
            const prior = ((idx - 2) >= 0) ? clauses.slice(0, idx - 1) : []
            const after = ((idx + 2) < clauses.length - 1) ? clauses.slice(idx + 2) : []
            clauses = [...prior, replacementClause, ...after ]
            didCalc = true
            break
          }
        }
      } while (clauses.length > 1 && didCalc)
      if (clauses.length === 1) break
    }
    return clauses[0]
  }
}
