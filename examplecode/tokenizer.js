const commands = [
  'INPUT',
  'KEY$',
  'KEY', // alternate
  'PRINT',
  'CSR',
  'GOTO',
  'ON',
  'IF',
  'THEN',
  'GOSUB',
  'RETURN',
  'FOR',
  'TO',
  'NEXT',
  'READ',
  'DATA',
  'RESTORE',
  'REM',
  'STOP',
  'END',
  'CLEAR',
  'LIST',
  'ALL',
  'RUN',
  'NEW',
  'PASS',
  'DEFM',
  'LET',
  'MODE',
  'SET',
  'LEN(',
  'MID$(',
  'MID(',
  'VAL(',
  'STR$(',
  'SAVE',
  'LOAD',
  'PUT',
  'GET',
  'VERIFY',
  'SIN',
  'COS',
  'TAN',
  'ASN',
  'ACS',
  'ATN',
  'SQR',
  'EXP',
  'LN',
  'LOG',
  'INT',
  'FRAC',
  'ABS',
  'DMS$(',
  'DEG(',
  'SGN',
  'RND(',
  'RAN#',
];

const symbols = {
  '=': 'equals',
  '<>': 'comparator',
  '<': 'comparator',
  '>': 'comparator',
  '<=': 'comparator',
  '>=': 'comparator',
  ':': 'separator',
  ';': 'semi',
  ',': 'comma',
  '(': 'open-paren',
  ')': 'close-paren',
  '+': 'operator',
  '-': 'operator',
  '*': 'opeartor',
  '/': 'operator',
  'pi': 'pi',
  '^': 'operator'
};

const INTEGERS = "0123456789";

function next_tok(rest_of_line) {
  // 8. valid symbol: =, <, >, <=, >=, <>, :, ;, (, ), +, -, *, /, pi, ^, ,

  if (rest_of_line.length === 0) {
    return [ null, 'eol', 1, rest_of_line, null ];
  }

  var loc = 0;
  var tok = "";
  while (rest_of_line[loc] === " ") { loc += 1; }
  rest_of_line = rest_of_line.substring(loc);
  // 1. command - string of characters matching one of command set
  for (cmdidx in commands) {
    var cmd = commands[cmdidx];
    if (rest_of_line.startsWith(cmd)) {
      tok = cmd;
      rest_of_line = rest_of_line.substring(tok.length);
      return [ tok, 'command', 1, rest_of_line, null ];
    }
  }
  // 2. symbol
  for (sym in symbols) {
    if (rest_of_line.startsWith(sym)) {
      tok = sym;
      rest_of_line = rest_of_line.substring(tok.length);
      return [ tok, symbols[sym], 1, rest_of_line, null ];
    }
  }

  // tokenize rest of line by starting char
  tok = rest_of_line[0];
  rest_of_line = rest_of_line.substring(1);

  // 3. a quoted string - starts and ends with double-quote, everything in between is literal
  if (tok === '"') {
    var end_quote_loc = rest_of_line.indexOf('"');
    if (end_quote_loc < 0) {
      tok += rest_of_line;
      return [ tok, 'string', tok.length, "", "unterminated string" ];
    }
    tok += rest_of_line.substring(0, end_quote_loc + 1);
    return [ tok, 'string', tok.length, rest_of_line.substring(end_quote_loc + 1), null ];
  }

  // 4. set param: E or F, followed by single integer 0-9
  if ((tok === "E" || tok === "F") && INTEGERS.indexOf(rest_of_line[0]) >= 0) {
    tok += rest_of_line[0];
    return [ tok, 'set-param', 2, rest_of_line.substring(1), null ];
  }

  // 5. variable - single letter or $, or letter followed by $, or letter followed by open paren, integer > 0, close paren
  if ("ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(tok) >= 0) {
    var next = rest_of_line[0];
    var err = null;
    if (next == "$") {
      tok += next;
      rest_of_line = rest_of_line.substring(1);
    } else if (next == "(") {
      do {
        tok += next;
        rest_of_line = rest_of_line.substring(1);
        if (rest_of_line.length === 0) {
          err = "unclosed array specifier";
        }
      } while (err === null && next !== ")");
    }
    return [ tok, 'variable', tok.length, rest_of_line, err ];
  }

  // 6. a program number: # followed by single integer 0-9
  if (tok === '#') {
    if (INTEGERS.indexOf(rest_of_line[0]) >= 0) {
      tok += rest_of_line[0];
      return [ tok, 'prog-num', 2, rest_of_line.substring(1), null ];
    }
  }

  // 7. decimal floating point - string of numbers with one dot (can start with dot), and optionally an E or E- with one or two more integers
  // 8. integer - string of numbers
  if (tok === "." || INTEGERS.indexOf(tok) >= 0) {
    var ty = "number";
    var has_decimal = (tok === ".");
    var has_e = false;
    var steps_mod = 0;
    var after_e = 0;
    var la = 0;
    var valid_num = true;
    var in_num = true;
    var num_chars = INTEGERS + ".e";
    do {
      var prev = tok;
      var next = rest_of_line[la];
      if (num_chars.indexOf(next) >= 0) {
        if (next === ".") {
          valid_num = !has_decimal && !has_e;
          has_decimal = true;
        } else if (next === "e") {
          valid_num = !has_e;
          has_e = true;
          if (rest_of_line[la + 1] === "-") {
            steps_mod = 1;
            la += 1;
          }
        } else if (has_e) {
          after_e += 1;
          if (after_e > 2) {
            valid_num = false;
          }
        }
      } else {
        in_num = false;
      }
      la += 1;
    } while (valid_num && in_num);
    if (!has_e && !has_decimal) {
      ty = 'integer';
    }
    tok += rest_of_line.substring(0, la - 1);
    return [ tok, ty, tok.length - steps_mod, rest_of_line.substring(la - 1), (valid_num ? null : "invalid number") ];
  }

  // fall through for now
  return [ tok, 'char', 1, rest_of_line, "unexpected token" ];
}

function tokenize_line(line) {
  var toks = [];
  var total_steps = 0;
  var tok = "";
  do {
    [ tok, type, steps, line, error ] = next_tok(line);
    toks.push({ token: tok, type: type, steps: steps, error: error });
    total_steps += steps;
  } while (tok !== null);
  return { tokens: toks, steps: total_steps };
}

// TEST CODE
// line = '1GOTO50:A="Hello World"';
// var max_steps = 544;
// r = tokenize_line(line);
// console.log(r.tokens);
// console.log(max_steps - r.steps, 'steps remaining');

module.exports = {
  tokenize_line: tokenize_line
};
