import nextToken from './tokenizer.js'
import * as Statements from './statements/statements.js'

const prioritizedOperators = [
  '*', '/', 'DIV', 'MOD', '+', '-',
  'AND', 'OR', 'NOT',
  '=', '<>', '>=', '<=', '>', '<'
]

export default class Lexifier {
  constructor() {
    this.specialHandlers = { }
    for (const statement in Statements) {
      Statements[statement].addLexicalHandlers(this.specialHandlers)
    }
  }

  lexifyLine(codeLine) {
    // parse line to first end-of-statement (LIVE only for now)
    let lineStatements = []
    let statementTokens = []
    let tokenStart = 0
    while (1 === 1) {
      let tokenDef = nextToken(codeLine, tokenStart)
      if (tokenDef.error) { return tokenDef }
      if (tokenDef.coding === 'end-of-statement') {
        const result = this.lexifyStatement(statementTokens)
        if (result.error) { return result }
        lineStatements.push(result)
        statementTokens = []
      } else {
        statementTokens.push(tokenDef)
      }
      if (tokenDef.restOfLine === null) {
        return { lineStatements }
      }
      codeLine = tokenDef.restOfLine
      tokenStart = tokenDef.tokenEnd
    }
  }

  lexifyStatement(statementTokens) {
    if (statementTokens.length === 0) return { coding: 'emtpy' }
    const firstToken = statementTokens.shift()
    // there are two types of execution statements:
    if (firstToken.coding.startsWith('variable-')) { // assignments
      return this.lexifyAssignment(firstToken, statementTokens)
    } else if (firstToken.coding === 'command' || firstToken.coding === 'statement') {
      return this.lexifyCommandOrStatement(firstToken, statementTokens)
    } else {
      return { error: `Syntax Error: ${firstToken.token}`, location: firstToken.tokenStart, endLocation: firstToken.tokenEnd }
    }
  }

  lexifyAssignment(variable, tokens) {
    if (tokens.length() === 0) {
      return { error: `Syntax Error ${variable.token}`, tokenStart: variable.tokenStart, tokenEnd: variable.tokenEnd }
    }
    let variableDef = { variable: variable, valueType: variable.coding.substring(9) }
    let token = tokens.shift()
    // array dimension(s)
    if (token.coding === 'open-paren') {
      const dimension = this.parseToCloseParen(tokens, token.tokenStart)
      if (dimension.error) { return dimension }
      if (dimension.parenTokens.length === 0) {
        return { error: 'Illegal Index', location: token.tokenStart, endLocation: dimension.tokenEnd }
      }
      const dimensionParams = this.parseIntoParameters(dimension.parenTokens, dimension[0].tokenStart)
      if (dimensionParams.error) { return dimensionParams }
      variableDef.dimension = dimensionParams.parameters
      tokens = dimensionParams.restOfTokens
    }
    if (tokens.length === 0) {
      return { error: 'Syntax Error', location: variable.tokenEnd, endLocation: token.tokenEnd + 1 }
    }
    token = tokens.shift()
    if (token.coding !== 'equal') {
      return { error: 'Syntax Error', location: token.tokenStart, endLocation: token.tokenEnd }
    }
    const expression = this.parseExpression(tokens, tokens[0].tokenStart)
    if (expression.error) { return expression }
    if (variableDef.valueType !== 'any' && expression.valueType !== variableDef.valueType) {
      return { error: 'Type Mismatch', location: expression.tokenStart, endLocation: expression.tokenEnd }
    }
    return { coding: 'assignment', variable: variableDef, valueExpression: expression }
  }

  lexifyCommandOrStatement(statement, tokens) {
    const handler = this.specialHandlers[`${statement.coding}|${statement.token}`]
    if (handler) {
      return handler(statement, tokens)
    } else {
      const tokenStart = tokens.length === 0 ? statement.tokenEnd : tokens[0].tokenStart
      const params = this.parseIntoParameters(tokens, tokenStart)
      if (params.error) { return params }
      return { coding: 'statement', statement: statement, parameters: params.parameters }
    }
  }

  parseToCloseParen(tokens, tokenStart) {
    let insideTokens = []
    let tokenEnd = tokenStart + 1
    while (1 === 1) {
      if (tokens.length === 0) {
        return { error: 'Unclosed Paren', location: tokenStart, endLocation: tokenEnd }
      }
      const token = tokens.shift()
      if (token.coding === 'open-paren') {
        insideTokens.push(token)
        const result = this.parseToCloseParen(tokens, token.tokenStart)
        if (result.error) { return result }
        insideTokens.push(...result.parenTokens) // flatten back out for later
        insideTokens.push(result.closeParen) // put close paren back
        tokens = result.restOfTokens
      } else if (token.coding === 'close-paren') {
        return { parenTokens: insideTokens, restOfTokens: tokens, tokenEnd: token.tokenEnd, closeParen: token }
      } else if (token.coding === 'end-of-statement') {
        tokens = [] // force end
      } else {
        insideTokens.push(token)
      }
    }
  }

  parseIntoParameters(tokens, tokenStart) {
    let paramTokens = []
    let params = []
    let tokenEnd = tokenStart
    while (1 === 1) {
      if (tokens.length === 0) {
        if (paramTokens.length > 0) {
          const expression = this.parseExpression(paramTokens, paramTokens[0].tokenStart)
          if (expression.error) { return expression }
          params.push(expression)
        }
        return { parameters: params, restOfTokens: tokens, tokenEnd }
      }
      const token = tokens.shift()
      if (token.coding === 'comma') {
        if (paramTokens.length === 0) {
          return { error: 'Unspecified Param', location: token.tokenStart, endLocation: token.tokenEnd }
        }
        const expression = this.parseExpression(paramTokens, paramTokens[0].tokenStart)
        if (expression.error) { return expression }
        params.push(expression)
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

  parseExpression(tokens, tokenStart) {
    let clauseTokens = []
    let tokenEnd = tokenStart
    let unaryOperator = null
    let hasNumbers = false
    let hasStrings = false
    let needOperator = false
    while (1 === 1) {
      if (tokens.length === 0) {
        if (clauseTokens.length === 0 || !needOperator) {
          return { error: 'Syntax Error', location: tokenStart, endLocation: tokenEnd }
        }
        const lastClause = clauseTokens.slice(-1)[0]
        if (unaryOperator) { lastClause.unaryOperator = unaryOperator }
        break
      }
      let token = tokens.shift()
      tokenEnd = token.tokenEnd
      if (token.coding === 'end-of-statement') {
        tokens = [] // push to end
      } else if (!needOperator && [ 'plus', 'minus', 'unary-operator' ].indexOf(token.coding) >= 0) {
        unaryOperator = { token: token.token, coding: 'unary-operator', tokenStart: token.tokenStart, tokenEnd: token.tokenEnd }
      } else if (token.coding === 'function') {
        if (tokens.length === 0) {
          return { error: 'Syntax Error', location: token.tokenStart, endLocation: tokenEnd }
        }
        if (hasNumbers && token.valueType === 'string') {
          return { error: 'Type Mismatch', location: token.tokenStart, endLocation: tokenEnd }
        } else if (hasStrings && token.valueType === 'number') {
          return { error: 'Type Mismatch', location: token.tokenStart, endLocation: tokenEnd }
        }
        const functionDef = token
        token = tokens.shift()
        if (token.coding !== 'open-paren') {
          return { error: 'Syntax Error', location: token.tokenStart, endLocation: token.tokenEnd }
        }
        const parenTokens = this.parseToCloseParen(tokens, tokenEnd)
        if (parenTokens.error) { return parenTokens }
        tokens = parenTokens.restOfTokens
        tokenEnd = parenTokens.tokenEnd
        const params = this.parseIntoParameters(parenTokens.parenTokens, tokenStart)
        clauseTokens.push({ coding: 'function', function: functionDef, parameters: params.parameters, valueType: functionDef.valueType, tokenStart: functionDef.tokenStart, tokenEnd })
        hasStrings = (functionDef.valueType === 'string')
        hasNumbers = (functionDef.valueType === 'number')
        needOperator = true
      } else if (token.coding === 'open-paren') {
        const parenTokens = this.parseToCloseParen(tokens, tokenEnd)
        if (parenTokens.error) { return parenTokens }
        if (parenTokens.length === 0) {
          return { error: 'Syntax Error', location: tokenEnd, endLocation: tokenEnd + 1 }
        }
        tokens = parenTokens.restOfTokens
        const subExpression = this.parseExpression(parenTokens.parenTokens, parenTokens.parenTokens[0].tokenStart)
        clauseTokens.push({ expression: subExpression, coding: 'paren-group', tokenStart, tokenEnd })
        needOperator = true
      } else if (token.coding === 'string-literal' || token.coding === 'variable-string') {
        if (unaryOperator || hasNumbers) {
          return { error: 'Type Mismatch', location: token.tokenStart, endLocation: tokenEnd }
        }
        clauseTokens.push(token)
        hasStrings = true
        needOperator = true
      } else if (token.coding === 'number-literal' || token.coding === 'variable-number' || token.coding === 'variable-integer') {
        if (hasStrings) {
          return { error: 'Type Mismatch', location: token.tokenStart, endLocation: tokenEnd }
        }
        clauseTokens.push(token)
        hasNumbers = true
        needOperator = true
      } else if (needOperator && [ 'plus', 'minus', 'equal', 'binary-operator' ].indexOf(token.coding) >= 0) {
        if (hasStrings && token.coding !== 'plus') {
          return { error: 'Type Mismatch', location: token.tokenStart, endLocation: tokenEnd }
        }
        const lastClause = clauseTokens.slice(-1)[0]
        if (unaryOperator) { lastClause.unaryOperator = unaryOperator }
        clauseTokens.push({ token: token.token, coding: 'binary-operator', tokenStart: token.tokenStart, tokenEnd })
        needOperator = false
        unaryOperator = null
      } else {
        return { error: 'Syntax Error', location: token.tokenStart, endLocation: tokenEnd }
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
            const replacementClause = {
              coding: 'calculation',
              pre: clauses[idx - 1],
              operator: clause,
              post: clauses[idx + 1],
              tokenStart: clauses[idx - 1].tokenStart,
              tokenEnd: clauses[idx + 1].tokenEnd
            }
            const prior = ((idx - 2) >= 0) ? clauses.slice(0, idx - 1) : []
            const post = ((idx + 2) < clauses.length - 1) ? clauses.slice(idx + 2) : []
            clauses = [...prior, replacementClause, ...post ]
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
