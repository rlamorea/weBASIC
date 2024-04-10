const toker = require('./tokenizer.js');
const fs = require('fs');

function lexify_line(line) {
  line = line.trim();
  if (line === "") {
    return { line_number: null, lexed_line: null, steps: 0, error: null };
  }

  var line_tokens, steps;
  tok_results = toker.tokenize_line(line);

  var line_no = null;
  var first_token = tok_results.tokens.shift();
  var steps = tok_results.steps;
  var error = null;
  if (first_token.type === "integer") {
    line_no = parseInt(first_token.token);
    steps += (2 - first_token.steps);
  } else if (first_token.type === "command" && first_token.token === "REM") {
    return { line_number: null, lexed_line: null, steps: 0, error: null };
  } else {
    error = "Invalid line: " + line;
  }

  return { line_number: line_no, lexed_line: tok_results.tokens, steps: steps, error: error }
}

var lex_file_name = (process.argv[2] || '').trim();
if (lex_file_name === "") {
  console.log('No file specified');
  process.exit();
}

var file_contents = fs.readFileSync(lex_file_name, 'utf8');
var lines = file_contents.split('\n');
var lexed_lines = {};
var steps_free = 544;
for (var l = 0; l < lines.length; l++) {
  var line = lines[l];
  var lex_result = lexify_line(line);
  if (lex_result.error) {
    console.log('ERROR ' + lex_result.error + ' in line: ' + line);
  } else if (lex_result.lexed_line) {
    lexed_lines[lex_result.line_number] = lex_result.lexed_line;
    steps_free -= lex_result.steps;
    console.log('line ' + lex_result.line_number + ' has ' + lex_result.steps + ' steps (' + steps_free + ' free)');
  }
}

console.dir(lexed_lines);
console.log('\nSteps Free: ' + steps_free);

module.exports = {
  lexify_line: lexify_line
};
