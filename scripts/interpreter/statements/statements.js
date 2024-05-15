import Assignment from './assignment.js'
import MathFunctions from "./mathFunctions.js";
import Print from './print.js'
import Input from './input.js'
import IfThen from './ifThen.js'
import DefFn from './defFn.js'
import ForNext from './forNext.js'
import ModeSwaps from './modeSwaps.js'
import ExecStatements from './execStatements.js'
import Jumps from './jumps.js'
import Data from './data.js'

const assignment = new Assignment()
const mathFunctions = new MathFunctions()
const print = new Print()
const input = new Input()
const ifThen = new IfThen()
const defFn = new DefFn()
const forNext = new ForNext()
const modeSwaps = new ModeSwaps()
const execStatements = new ExecStatements()
const jumps = new Jumps()
const data = new Data()

export {
  assignment,
  mathFunctions,
  print,
  input,
  ifThen,
  defFn,
  forNext,
  modeSwaps,
  execStatements,
  jumps,
  data,
}
