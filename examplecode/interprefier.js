const lexifier = require('./lexifier.js');

const variables = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MAX_STEPS = 544;
var available_steps = MAX_STEPS;
var memory_eaten_steps = 0;

var variable_memory = [];
var dollar = "";
var display = "";

function reset_memory(extra = 0) {
  variable_memory = [];
  for (var i = 0; i < (variables.length + extra); i++) {
    variable_memory.push({
      type: 'number',
      value: 0,
      array_idx: (i < 26 ? null : (i - 24))
    });
  }
  memory_eaten_steps = extra;
}

reset_memory();
available_steps -= memory_eaten_steps;

function dump_memory() {
  console.log('[[[' + display + ']]]');
  console.log('$="'+dollar+'"');
  for (var i = 0; i < variable_memory.length; i++) {
    var m = variable_memory[i];
    var v_idx = i;
    if (m.array_idx) {
      v_idx -= (m.array_idx - 1);
    }
    var v_name = variables[v_idx];
    if (m.type === 'string') {
      v_name += '$';
    }
    if (m.array_idx) {
      v_name += '('+m.array_idx+')';
    }
    var value = (m.type === 'string' ? '"'+m.value+'"' : m.value);
    console.log(v_name+'='+value);
  }
}

dump_memory();
