import { keywordList } from '../../interpreter/tokenizer.js'

const weBASICLanguage  = {
  keywords: keywordList,
  tokenizer: {
    root: [
      [ /^\d+/, 'linenumber' ],
      [ /(`|[rR][eE][mM]).*/, 'comment' ],
      [ /[a-zA-Z][\w$%]*/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'variable'
        }
      } ],
      [ /".*?"/, 'string' ],
      [ /[+-]?\d*\.?\d+([eE]?[+-]?\d+)?/, 'number' ],
      [ /[\(\)]/, 'paren' ],
    ]
  }
}

// list of color options: https://github.com/microsoft/monaco-editor/issues/1631
const weBASICTheme = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'linenumber', foreground: '#FAEBD7' },
    { token: 'keyword', foreground: '#d2691e' },
    { token: 'variable', foreground: '#00CED1' },
    { token: 'string', foreground: '#FFD700' },
    { token: 'comment', foreground: '#A9A9A9' },
    { token: 'number', foreground: '#BA55D3' },
    { token: 'parens', foreground: '#FFFFFF' },
  ],
  colors: {
    'editor.background': '#000000',
    'editor.foreground': '#ffffff',
    'editorCursor.foreground': '#ffffff',
    'editorBracketHighlight.foreground1': '#ffffff',
    'editorBracketHighlight.foreground2': '#ffffff',
    'editorBracketHighlight.foreground3': '#ffffff',
    'editorBracketHighlight.foreground4': '#ffffff',
    'editorBracketHighlight.foreground5': '#ffffff',
    'editorBracketHighlight.foreground6': '#ffffff',
  }
}

const weBASICConfig = {
  brackets: [ [ '(', ')' ] ],
  // colorizedBracketPairs: [ [ '(', ')' ]],
}

export { weBASICLanguage, weBASICTheme, weBASICConfig }