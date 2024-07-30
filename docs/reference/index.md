---
layout: default
title: Language Reference
nav_order: 5
has_children: true
---

# weBASIC Language Reference

Learn about:

- [**Operating Modes**](modes)
- [**Variables and Assignment**](variables)
- [**Lines and Execution Flow**](jumps)
- [**Execution Commands**](execution)
- [**Math Operators**](operator-math)
- [**Comparison Operators**](operator-compare)
- [**Logic Operators**](operator-logic)
- [**Bitwise Operators**](operator-bitwise)
- [**Math Functions**](function-math)
- [**User Functions**](user-functions)
- [**String Functions**](function-string)
- [**Printing**](print)
- [**Input**](input)
- [**Conditionals**](conditionals)
- [**Looping**](loops)
- [**Reading Data**](reading-data)
- [**File Management**](files)
- [**Commenting**](comments)

or go to the 

[List of Operators, Functions, Statements, and Commands](#index)

## Reading a Language Feature Reference

Every command, statement, function, and operator in weBASIC has its own reference section.

This section will usually be part of a page with related commands, statements, functions,
and operators. The reference will look something like:

----

{: .note-title }
> Name
> 
> The name of the language feature being documented is the title of the page

## `PRINT`

{: .note-title }
> Usage
> 
> Next the usage of the language feature is provided. This uses a notation [discussed below](#notation) 

Usage:

<pre>
PRINT [<i>print-spec</i>][;<i>print-spec</i>...][;]
</pre>

{: .note-title }
> Summary
> 
> A summary of the language feature is next.

PRINTs content to the current screen.

{: .note-title }
> Usage Details
> 
> A breakdown of the usage, detailing each item and other important asepcts of the language feature

- <i>print-spec</i> - something to print, this could be:
  - a string literal like `"hello"`
  - a number, like `105.2`
  - a variable,  like `result`
  - an _expression_ like `3*(4+value)`
  - a function, like `SIN(angle)`
  
Any number of <i>print-spec</i>s can be provided, separated by semicolons (;).

Normally a PRINT statement will move the cursor to the start of the next line after all of the 
<i>print-spec</i>s are written out. If the PRINT ends with a semicolon (;), the cursor remains
at the end of the PRINTed content, and the next PRINTs will append from that location.

{: .note-title }
> Examples
> 
> One or more examples of the language feature are provided

**EXAMPLES**

- `PRINT` - print a blank line
- `PRINT "hello world"` - print a string literal
- `PRINT "hello ";name$` - print a string followed by a string variable
- `PRINT a;"+";b;"=";(a+b)` - print an equation and result
- `PRINT "waiting";` - print a string, let the next PRINT append to it

{: .note-title }
> Counter-examples, Mini-Programs, and More
> 
> Some pages will include counter-examples -- cases that generate errors or should be avoided -- or
> mini-programs to show the language feature in a "real world" setting. The language feature might
> also include design notes.

----

### Notation

The usage for each language feature tries to present some pretty complex ideas in a compact format.

Here is how you can read usage:

- if a word is in _italics_ it is a special entity. Some of these are standard, 
  some are unique to the language feature or more clearly describe the purpose of the entity. 
  Entities may have subscripts if there are more than one of a given type of entity.
  Standard entities are:
  - <i>expression</i> - a numeric value, or a variable or expression that produces one
  - <i>integer</i> - a numeric value that is a whole number, or a variable or expression that produces one
  - <i>string</i> - a string value, or a variable or expression that produces one
  - <i>condition</i> - an expression representing a comparison
  - <i>line number</i> - a line number
- if something is in square brackets (\[ and \]), it is _optional_. Optional usage may be nested.
- if something is followed by three dots (...) that means this particular thing can be repeated as many times as needed.

## Index

[symbols](#symbols) [A](#a) [B](#b) [C](#c) [D](#d) [E](#e) [F](#f) [G](#g) [H](#h) [I](#i)
[J](#j) [K](#k) [L](#l) [M](#m) [N](#n) [O](#o) [P](#p) [Q](#q) [R](#r) [S](#s) [T](#t)
[U](#u) [V](#v) [W](#w) [X](#x) [Y](#y) [Z](#z)

### Symbols

- [<b>^</b> - exponentiation](operator-math#-power)
- [<b>*</b> - multiplication](operator-math#--multiply)
- [<b>/</b> - division](operator-math#-divide)
- [<b>+</b> - addition](operator-math#-add)
- [<b>+</b> - string concatenate](function-string#concat)
- [<b>-</b> - subtraction](operator-math#--subtract)
- [<b>-</b> - negation](operator-math#--negate)
- [<b>( )</b> - parentheses](operator-math#-)
- [<b>=</b> - assignment](variables#-equals)
- [**<** - less than](operator-compare#-less-than)
- [<b><=</b> - less than or equal to](operator-compare#-less-than-or-equal)
- [<b>=</b> - equal to](operator-compare#-equal-to)
- [<b>>=</b> - greater than or equal to](operator-compare#--greater-than-or-equal)
- [<b>></b> - greater than](operator-compare#--greater-than)
- [<b>`</b> - comment](comments#-backtick)

### A

- [**ABS** - absolute value](function-math#abs)
- [**ASC** - ascii code of character](function-string#asc)
- [**AND** - logical and](operator-logic#and)
- [**ATN** - arc-tangent](function-math#atn)

### B

- [**BAND** - bitwise AND](operator-bitwise#band)
- [**BNOT** - bitwise NOT](operator-bitwise#bnot)
- [**BOR** - bitwise OR](operator-bitwise#bor)
- [**BXOR** - bitwise exclusive OR](operator-bitwise#bxor)

### C

- [**CATALOG** - list files](files#catalog)
- [**CHARAT$** - character at location](function-string#charat)
- [**CHR$** - ascii code to character](function-string#chr)
- [**CONT** - continue execution](execution#cont)
- [**COPY** - copy a file](files#copy)
- [**COS** - cosine](function-math#cos)

### D

- [**DATA** - data statement](reading-data#data)
- [**DEF FN** - define user function](user-functions)
- [**DIM** - dimension array](variables#dim)
- [**DIV** - integer divide](operator-math#div)

### E

- [**EDIT** - enter edit mode](modes#edit)
- [**ELSE** - else condition handling](conditionals#if)
- [**END** - end execution](execution#end)
- [**EXP** - return e to power](function-math#exp)

### F

- [**FN** - call user function](user-functions)
- [**FOR/TO** - for loop](loops#forto)
- [**FRAC** - fractional portion](function-math#frac)

### G

- [**GET** - get last key pressed](input#get)
- [**GOSUB** - goto subroutine](jumps#gosub)
- [**GOTO** - goto line](jumps#goto)

### I

- [**IF/THEN/ELSE** - conditional](conditionals#ifthen)
- [**INPUT** - get user input](input#input)
- [**INT** - integer value](function-math#int)

### L

- [**LEFT$** - get left portion of string](function-string#left)
- [**LEN** - length of string](function-string#len)
- [**LET** - assignment](variables#let)
- [**LIST** - list code](modes#list)
- [**LIVE** - switch to live mode](modes#live)
- [**LOAD** - load a program](files#load)
- [**LOG** - natural logarithm](function-math#log)
- [**LOG10** - base-10 logarithm](function-math#log10)

### M

- [**MID$** - get middle of string](function-string#mid)
- [**MOD** - integer remainder (modulo)](operator-math#mod)

### N

- [**NEXT** - end for loop](loops#next)
- [**NEW** - erase current program](execution#new)
- [**NOT** - logical not](operator-logic#not)

### O

- [**ON...GOTO/GOSUB** - conditional jumps](jumps#ongotogosub)
- [**OR** - logical or](operator-logic#or)

### P

- [**PI** - value of pi](function-math#pi)
- [**PRINT** - print to screen](print#print)

### R

- [**READ** - read data](reading-data#read)
- [**REM** - comment (remark)](comments#rem)
- [**RENAME** - rename a file](files#rename)
- [**RESTORE** - reset read pointer](reading-data#restore)
- [**RETURN** - return from subroutine](jumps#return)
- [**RIGHT$** - get right portion of string](function-string#right)
- [**RND** - return random number](function-math#rnd)
- [**ROUND** - round number](function-math#round)
- [**RUN** - start execution](execution#run)

### S

- [**SAVE** - save a program](files#save)
- [**SCRATCH** - delete a file](files#scratch)
- [**SETDIR** - set current directory](files#setdir)
- [**SGN** - sign of value](function-math#sgn)
- [**SIN** - sine](function-math#sin)
- [**SLEEP** - pause execution](execution#sleep)
- [**SQR** - square root](function-math#sqr)
- [**STEP** - step amount of for loop](loops#step)
- [**STOP** - stop execution](execution#stop)
- [**STR$** - convert number to string](function-string#str)

### T

- [**TAN** - tangent](function-math#tan)

### V

- [**VAL** - value of string](function-string#val)

