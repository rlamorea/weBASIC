---
layout: default
title: Learning the Language
nav_order: 4
---

# Learning the Language

At its core, weBASIC is just BASIC. Although there really isn't a standard for the BASIC programming
language, there is a set of commands and syntax that are common across every implementation of it.

Let's explore these.

{: .highlight-title }
> What's Below
> 
> - [**What You Should Know By Now** - just checking](#what-you-should-know-by-now)
> - [**Being Expressive** - literals and expressions](#being-expressive)
> - [**Variable Nature** - all about using variables](#variable-nature)
> - [**Function Junction** - mathematic functions](#function-junction)
> - [**Acting Output**- using PRINT](#acting-output)
> - [**Stringing Together** - character string functions](#stringing-together)
> - [**Gathering INPUT** - using INPUT](#gathering-input)
> - [**Critical Condition** - conditional execution](#critical-condition)
> - [**Thrown for a Loop** - looping execution](#thrown-for-a-loop)
> - [**Do You Have Any Comment?** - adding comments to your code](#do-you-have-any-comment) 
> - [**Reading Comprehension** - reading in data](#reading-comprehension)
> - [**Routine Maintenance** - subroutines and reusable code](#routine-maintenance)
> - [**Where to Next?** - more to explore](#where-to-next)

## What You Should Know By Now

If you've [gotten started](getting-started) and 
[written your first program](first-program), 
then you should have beginning understanding of:

- [The `PRINT` command](getting-started#your-first-command)
- [Mathematic operators](getting-started#operator-operator)
- [Mathematic functions](getting-started#whats-your-function)
- [Line numbers in programs](first-program#taking-a-hard-line)
- [The `GOTO` statement](first-program#jump-jump-jump)
- [The `RUN` command](first-program#say-hello)
- [The `SAVE`](first-program#save-yourself) and [`LOAD` commands](first-program#bring-that-back)
- [The `NEW` command](first-program#starting-anew)
- [Using variables](first-program#remember-me)
- [The `INPUT` statement](first-program#what-did-you-say)

## Being Expressive

When you played with using `PRINT` to get the answers to mathematical equations, you were writing expressions.

An **Expression** is meant to produce a result. It could be as simple as a number or as complicated as a
long and involved equation.

### A Literal Take

The simplest form of expression is a single value. This is called a **Literal**.

A _literal_ number is any single numeric value. Examples of this are:

- `0` - the number 0
- `-25` - a negative number
- `1.555` - a positive number with decimals
- `5e+5` - a number with scientific notation and a positive power of ten
- `-6.55e-2` - a negative number with scientific notation and a fractional power of ten

{: .note-title }
> Really Big and Really Small
> 
> "Scientific Notation" is a way of representing numbers that are very large or very small.
> 
> Consider two examples:
> - A light year is about <tt>9461000000000000</tt> meters
> - A hydrogen atom is about <tt>0.000000000106</tt> meters
>
> Instead of writing all those zeros, these values can be represented by multipying by a power of ten, like:
> 
> - A light year is about <tt>9.461&times;10<sup>15</sup></tt> meters
> - A hydrogen atom is about <tt>1.06&times;10<sup>-10</sup></tt> meters
> 
> Since weBASIC doesn't have the ability to do superscripts, the &times;10 is represented
> by an `e` with the power following:
> 
> - `A light year is about 9.461e15 meters`
> - `A hydrogen atom is about 1.06e-10 meters`

### Smooth Operator

Numbers can be combined together in equations by using operators.

An **Operator** either modifies a number value or combines two numbers to produce a result.

The common operators in weBASIC are:

- `-` - negation, as in `-1`. Negates the number that follows it.
- `^` - power (or exponentiation), as in `2^3` or "two to the power of three" (= <tt>8</tt>)
- `*` - multiplication, as in `2*3`, or "two times three" (= <tt>6</tt>)
- `/` - division, as in `3/2`, or "three divided by two" (= <tt>1.5</tt>)
- `DIV` - integer division, as in `3 DIV 2`, or "how many twos completely fit into three" (= <tt>1</tt>)
- `MOD` - remainder, as in `3 MOD 2`, or "what's left over after integer dividing three by two" (= <tt>1</tt>)
- `+` - addition, as in `2+3`, or "two plus three" (= <tt>5</tt>)
- `-` - subtraction, as in `3-2`, or "three minus two" (= <tt>1</tt>)
- `BNOT` - bitwise inversion (NOT), as in `BNOT 55` (= <tt>-56</tt>)
- `BAND` - bitwise AND, as in `244 BAND 195` (= <tt>192</tt>)
- `BOR` - bitwise OR, as in `244 BOR 195` (= <tt>247</tt>)
- `BXOR` - bitwise exclusive OR (XOR), as in `244 BXOR 195` (= <tt>55</tt>)

#### Keeping a Float

You might have noticed that weBASIC uses an asterisk (<tt>*</tt>) for multiplication instead of the normal multiplication
symbol (&times;). It also uses a slash (<tt>/</tt>) for division instead of the division symbol (&divide;). This is a case
of using the more common key on the keyboard (look at your keyboard and see if you can figure out how to make
either a &times; or &divide; symbol show up). The symbols might be different, but the mathematical operation 
should be familiar.

But there are two other operators that you might not be so familiar:

- `DIV` - integer division, as in `3 DIV 2`, or "how many twos completely fit into three" (= <tt>1</tt>)
- `MOD` - remainder, as in `3 MOD 2`, or "what's left over after integer dividing three by two" (= <tt>1</tt>)

These are special operators meant for dealing with _integers_. An integer is a number that has no fractional
value -- that is to say there is nothing after the decimal point (or, even more accurately, there are only
zeros after the decimal point). Integers are values like:

- <tt>1</tt>
- <tt>10</tt>
- <tt>256</tt>
- <tt>-4</tt>
- <tt>-1003</tt>
- and so on.

You might know them as "whole" numbers.

A number that does have a fraction are called _floating point_ numbers, like:

- <tt>1.1</tt>
- <tt>100.3</tt>
- <tt>0.0054</tt>
- and so on

You might have seen them called "real" numbers.

{: .note-title }
> Decimals and Fractions
> 
> A floating point number like <tt>1.693548387096774</tt> can _seem_ very precise, but sometimes it is really just
> an approximation.
> 
> Consider the value of two thirds (<tt><sup>2</sup>/<sub>3</sub></tt>), which would be the value <tt>0.66666666666667</tt> 
> as a floating point number. But that <tt>7</tt> at the end isn't the true value. It represents rounding up 
> the <tt>6</tt> that would normally follow if you had an infinite number of decimal places.
> 
> There are many values that can only be approximated when represented in a decimal form. This means
> that floating point math is never truly precise.

{: .note-title }
> Fractions: It Gets Worse!
>
> Inside the computer, numbers aren't represented as decimal values, but
> a format based on binary (or base-2), which approximates the decimal (or base-10) numbers we are used
> to seeing. Just as a decimal floating point number can only approximate certain fractions, a binary
> floating point number can only approximate certain decimals.
>
> You can see this happen with this example:
> <pre>PRINT 0.1*0.2<br/>0.020000000000000004<br/><br/>Ready.<br/><cursor>_</cursor></pre>
>
> You'd expect the answer to be `0.02`, right? But the conversion of those values from decimal
> to binary and back and again introduces _just enough_ rounding error that the end result is
> a tiny bit off.
>
> This is just the way it is with computers. There are ways around it, but that is beyond the scope
> of what weBASIC is trying to achieve.

An integer multiplied by (or added to, or subtracted from) an integer will always result in another integer.

- <tt>3 * 2 = 6</tt>
- <tt>-4 * 7 = -28</tt>
- <tt>105 * 62 = 6510</tt>

This is not the case when you divide two integers:

- <tt>3 / 2 = 1.5</tt>
- <tt>-4 / 7 = -0.5714285714285714</tt>
- <tt>105 / 62 = 1.6935483870967742</tt>

weBASIC has two more operators to deal with division with integers: `DIV` and `MOD`

The `DIV` operator works like division, but only returns the integer portion of the result.
The `MOD` operator returns the remainder of the division -- the portion of the divisor left over.

Thw two together produce two integer numbers that represent the final answer:

- <tt>3 DIV 2 = 1, 3 MOD 2 = 1 (or 1&frac12;)</tt>
- <tt>-4 DIV 7 = 0, -4 MOD 7 = -4 (or -<sup>4</sup>/<sub>7</sub>)</tt>
- <tt>105 / 62 = 1, 105 MOD 62 = 43 (or 1<sup>43</sup>/<sub>62</sub>)</tt>

Note that the sign is preserved in both the DIV and MOD results, so:

- <tt>-3 DIV 2 = -1, -3 MOD 2 = -1</tt>

#### Going to Bits

Another set of operators that might not be familiar to you are those beginning with <tt>B</tt>:

- `BNOT` - bitwise inversion (NOT), as in `BNOT 244` (= <tt>-245</tt>)
- `BAND` - bitwise AND, as in `244 BAND 195` (= <tt>192</tt>)
- `BOR` - bitwise OR, as in `244 BOR 195` (= <tt>247</tt>)
- `BXOR` - bitwise exclusive OR (XOR), as in `244 BXOR 195` (= <tt>55</tt>)

These are _bitwise_ operators, which means they focus on the "bits" of the values being operated on.

Bitwise operators only work on integer numbers, and are actually limited to what are called 32-bit integers,
which means between the values of <tt>-2147483648</tt> and <tt>2147483647</tt>.

It might be easier to look at this as the range of values between <tt>-2<sup>31</sup></tt> and <tt>2<sup>31</sup>-1</tt>.

Why? Because bitwise operators are all about thinking about numbers in binary, or base-2.

Binary means you only have the digits <tt>0</tt> and <tt>1</tt>. Each "place" in a binary number is a power of 2.

Here are the first 8 powers of 2:

| <tt>2<sup>7</sup></tt> | <tt>2<sup>6</sup></tt> | <tt>2<sup>5</sup></tt> | <tt>2<sup>4</sup></tt> | <tt>2<sup>3</sup></tt> | <tt>2<sup>2</sup></tt> | <tt>2<sup>1</sup></tt> | <tt>2<sup>0</sup></tt> |
|:----------------------:|:----------------------:|:----------------------:|:----------------------:|:----------------------:|:----------------------:|:----------------------:|:----------------------:|
|      <tt>128</tt>      |      <tt>64</tt>       |      <tt>32</tt>       |      <tt>16</tt>       |       <tt>8</tt>       |       <tt>4</tt>       |       <tt>2</tt>       |       <tt>1</tt>       |

You can think of these in the same way you think of <tt>10</tt>s places in a decimal (or base-10) number.

|    Value     | <tt>10<sup>2</sup> = 100</tt> | <tt>10<sup>1</sup> = 10</tt> | <tt>10<sup>0</sup> = 1</tt> |
|:------------:|:-----------------------------------:|:---------------------------------:|:---------------------------:|
| <tt>244</tt> |        <tt>2</tt>         |        <tt>4</tt>        |         <tt>4</tt>          |

<p style="text-align:center"><tt>2&times;100 + 4&times;10 + 7&times;1 = 247</tt></p>

You can represent the same number in binary as:

|  Value   | <tt>2<sup>7</sup> = 128</tt> | <tt>2<sup>6</sup> = 64</tt> | <tt>2<sup>5</sup> = 32</tt> | <tt>2<sup>4</sup> = 16</tt> | <tt>2<sup>3</sup> = 8</tt> | <tt>2<sup>2</sup> = 4</tt> | <tt>2<sup>1</sup> = 2</tt> | <tt>2<sup>0</sup> = 1</tt> |
|:--------:|:----------------------------:|:---------------------------:|:---------------------------:|:---------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|
| 11110111 |     <tt>1</tt>     |     <tt>1</tt>     |     <tt>1</tt>     |         <tt>1</tt>          |     <tt>0</tt>     |     <tt>1</tt>     |         <tt>0</tt>         |         <tt>0</tt>         |

<p style="text-align:center"><tt>1&times;128 + 1&times;64 + 1&times;32 + 1&times;16 + 1&times;4 = 244</tt></p>

Each "place" of a binary number is called a "bit" -- which is a contraction of "binary digit".

"Bitwise" operators are operators that work with these "bits".

There are four operators. Here are how they each operate on a single bit:

| A | B | BNOT A | A BAND B | A BOR B | A BXOR B |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 0 | 1 | 0 | 0 | 0 |
| 0 | 1 | 1 | 0 | 1 | 1 |
| 1 | 0 | 0 | 0 | 1 | 1 |
| 1 | 1 | 0 | 1 | 1 | 0 |

When comparing two values with a bitwise operator, the bits of each "place" are compared using these results.

Look at the expression `244 BAND 195`:

|      | <tt>2<sup>7</sup> = 128</tt> | <tt>2<sup>6</sup> = 64</tt> |  <tt>2<sup>5</sup> = 32</tt>  |  <tt>2<sup>4</sup> = 16</tt>  | <tt>2<sup>3</sup> = 8</tt> |  <tt>2<sup>2</sup> = 4</tt>  |  <tt>2<sup>1</sup> = 2</tt>  |  <tt>2<sup>0</sup> = 1</tt>  |     Value      |
|:----:|:----------------------------:|:---------------------------:|:-----------------------------:|:-----------------------------:|:--------------------------:|:----------------------------:|:----------------------------:|:----------------------------:|:--------------:|
|      |     <tt>1</tt>     |     <tt>1</tt>     |          <tt>1</tt>           |          <tt>1</tt>           |     <tt>0</tt>     |          <tt>1</tt>          |          <tt>0</tt>          |          <tt>0</tt>          |  <tt>244</tt>  |
|      |     <tt>1</tt>     |     <tt>1</tt>     |          <tt>0</tt>           |          <tt>0</tt>           |     <tt>0</tt>     |          <tt>0</tt>          |          <tt>1</tt>          |          <tt>1</tt>          |  <tt>195</tt>  |
| BAND |     <tt>1</tt>     |     <tt>1</tt>     |          <tt>0</tt>           |          <tt>0</tt>           |     <tt>0</tt>     |          <tt>0</tt>          |          <tt>0</tt>          |          <tt>0</tt>          |  <tt>192</tt>  |

Here is how the expression `244 BOR 195` is calculated:

Look at the expression `244 BAND 195`:

|     | <tt>2<sup>7</sup> = 128</tt> | <tt>2<sup>6</sup> = 64</tt> | <tt>2<sup>5</sup> = 32</tt> | <tt>2<sup>4</sup> = 16</tt> | <tt>2<sup>3</sup> = 8</tt> | <tt>2<sup>2</sup> = 4</tt> | <tt>2<sup>1</sup> = 2</tt> | <tt>2<sup>0</sup> = 1</tt> |    Value     |
|:---:|:----------------------------:|:---------------------------:|:---------------------------:|:---------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:------------:|
|     |     <tt>1</tt>     |     <tt>1</tt>     |         <tt>1</tt>          |         <tt>1</tt>          |     <tt>0</tt>     |         <tt>1</tt>         |         <tt>0</tt>         |         <tt>0</tt>         | <tt>244</tt> |
|     |     <tt>1</tt>     |     <tt>1</tt>     |         <tt>0</tt>          |         <tt>0</tt>          |     <tt>0</tt>     |         <tt>0</tt>         |         <tt>1</tt>         |         <tt>1</tt>         | <tt>195</tt> |
| BOR |     <tt>1</tt>     |     <tt>1</tt>     |         <tt>1</tt>          |         <tt>1</tt>          |     <tt>0</tt>     |         <tt>1</tt>         |         <tt>1</tt>         |         <tt>1</tt>         | <tt>247</tt> |

And for `244 BXOR 195`

|     | <tt>2<sup>7</sup> = 128</tt> | <tt>2<sup>6</sup> = 64</tt> | <tt>2<sup>5</sup> = 32</tt> | <tt>2<sup>4</sup> = 16</tt> | <tt>2<sup>3</sup> = 8</tt> | <tt>2<sup>2</sup> = 4</tt> | <tt>2<sup>1</sup> = 2</tt> | <tt>2<sup>0</sup> = 1</tt> |    Value     |
|:---:|:----------------------------:|:---------------------------:|:---------------------------:|:---------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:------------:|
|     |          <tt>1</tt>          |         <tt>1</tt>          |         <tt>1</tt>          |         <tt>1</tt>          |     <tt>0</tt>     |         <tt>1</tt>         |         <tt>0</tt>         |         <tt>0</tt>         | <tt>244</tt> |
|     |          <tt>1</tt>          |         <tt>1</tt>          |         <tt>0</tt>          |         <tt>0</tt>          |     <tt>0</tt>     |         <tt>0</tt>         |         <tt>1</tt>         |         <tt>1</tt>         | <tt>195</tt> |
| BOR |          <tt>0</tt>          |         <tt>0</tt>          |         <tt>1</tt>          |         <tt>1</tt>          |     <tt>0</tt>     |         <tt>1</tt>         |         <tt>1</tt>         |         <tt>1</tt>         | <tt>55</tt>  |

{: .note-title }
> Paying a Complement
> 
> So what about the expression `BNOT 244`?
> 
> |      | <tt>2<sup>7</sup> = 128</tt> | <tt>2<sup>6</sup> = 64</tt> | <tt>2<sup>5</sup> = 32</tt> | <tt>2<sup>4</sup> = 16</tt> | <tt>2<sup>3</sup> = 8</tt> | <tt>2<sup>2</sup> = 4</tt> | <tt>2<sup>1</sup> = 2</tt> | <tt>2<sup>0</sup> = 1</tt> |    Value     |
> |:----:|:----------------------------:|:---------------------------:|:---------------------------:|:---------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:--------------------------:|:------------:|
> |      |          <tt>1</tt>          |         <tt>1</tt>          |         <tt>1</tt>          |         <tt>1</tt>          |         <tt>0</tt>         |         <tt>1</tt>         |         <tt>0</tt>         |         <tt>0</tt>         | <tt>244</tt> |
> | BNOT |          <tt>0</tt>          |         <tt>0</tt>          |         <tt>0</tt>          |         <tt>0</tt>          |         <tt>1</tt>         |         <tt>0</tt>         |         <tt>1</tt>         |         <tt>1</tt>         | <tt>11</tt>  |
> 
> But, `PRINT BNOT 244` gives a result of `-245`. What's that about?
> 
> This is where things get a little complicated. First of all, as stated earlier, weBASIC bitwise operators
> operate on 32-bit integers. So the actual binary value for <tt>244</tt> is:
> 
> <p style="text-align: center"><tt>00000000000000000000000011110100</tt></p>
>
> That accounts for all 32 bits. And that means the actual value of `BNOT 244` is:
> 
> <p style="text-align: center"><tt>11111111111111111111111100001011</tt></p>
>
> Which you might think would be <tt>4294967051</tt> (at least if you wanted to add up all those powers of 2).
> 
> But with 32-bit integers, a 1 in the left-most digit (the one for <tt>2<sup>31</sup></tt>) indicates this is
> a _negative_ number. To make things even more complicated, this is a "2s Complement" negative number,
> which means to get the absolute value of this negative number you invert all the bits and add one:
> 
> <p style="text-align: center"><tt>00000000000000000000000011110101</tt></p>
>
> This is the value <tt>245</tt>, but negative, so `-245`
> 
> Do you really need to understand this? Not really. But this is part of how computers work at their lowest level.

#### Setting a Precedent

Operators are applied in an order called the "order of operations" or "operator precedence".

The order of precedence of operators in weBASIC is:

1. `-` - negation
2. `BNOT` - bitwise inversion (NOT)
2. `^` - power
2. `*` - multiplication
3. `/` - division
4. `DIV` - integer division
5. `MOD` - remainder
6. `+` - addition
7. `-` - subtraction
8. `BAND` - bitwise AND
9. `BOR` - bitwise OR
10. `BXOR` - bitwise exclusive OR (XOR)

This means that given an expression with multiple operators, those with highest priority will be resolved
first. For example:

<pre>
PRINT 300 + 4 * 3^2 / 6 - 8
298

READY.
<cursor>_</cursor>
</pre>

The order of operations means that this equation is broken down as follows:

1. <tt>300 + 4 * <b>3^2</b> / 6 - 8</tt> - power is determined first
2. <tt>300 + <b>4 * 9</b> / 6 - 8</tt> - next is multiplication
3. <tt>300 + <b>36 / 6</b> - 8</tt> - then division
4. <tt><b>300 + 6</b> - 8</tt> - then addition
5. <tt><b>306 - 8</b></tt> - and finally subtraction
6. <tt>298</tt>

You might recognize equations like this attached to "95% of people get this wrong" memes. Order of
operations is not just something computers use (though computers tend to be a bit more specific about
it).

#### Cutting In Line

If you've got a complicated expression trying to rely on order of operation to make sure you get the
correct result can be risky at best and impossible at worst.

The way around this is to use _parentheses_.  Wrapping a portion of an expression in parentheses tells
the computer "do this first". For example:

<pre>
PRINT (300 + 4) * 3^2 / 6 - 8
448

READY.
<cursor>_</cursor>
</pre>

This time, the expression is computed like this:

1. <tt><b>(300 + 4)</b> * 3^2 / 6 - 8</tt> - whatever is in the parentheses comes first
2. <tt>304 * <b>3^2</b> / 6 - 8</tt> - now we can do power
3. <tt><b>304 * 9</b> / 6 - 8</tt> - on to multiplication
4. <tt><b>2736 / 6</b> - 8</tt> - and then division
5. <tt><b>456 - 8</b></tt> - and finally subtraction
6. <tt>448</tt>

You can even put parentheses inside other parentheses (this is called **nesting**), and the expression
in the _innermost_ parentheses are done first, then the computer works out from there. For example:

<pre>
PRINT 300 + 4 * (3^2 / (6 - 8))
282

READY.
<cursor>_</cursor>
</pre>

The breakdown this time is:

- <tt>300 + 4 * (3^2 / <b>(6 - 8)</b>)</tt> - innermost parentheses
- <tt>300 + 4 * (<b>3^2</b> / -2)</tt> - power (operator precedence applies _within_ parentheses)
- <tt>300 + 4 * <b>(9 / -2)</b></tt> - now the next "layer" of parentheses
- <tt>300 + <b>4 * -4.5</b> - finally got to multiplication
- <tt><b>300 + -18</b> - and finish with addition
- <tt><b>282</b></tt>

{: .note-highlight }
> Help Yourself (and Others)
> 
> Using parentheses in expressions is sometimes necessary, and sometimes optional. But if you have
> a complicated expression, it can often help to use parentheses just to keep things straight when you
> (and others) review your program code.
> 
> Even though `PRINT 300 + 4 * 3^2 / 6 - 8` produces a result of `298`, it requires knowledge of
> operator precedence to know _why_.
> 
> This could also be written as:
> 
> <pre>PRINT 300 + (((4 * (3^2)) / 6) - 8)<br/>298<br/><br/>Ready.<br/><cursor>_</cursor></pre>
>
> Using the nested parentheses make it _totally_ clear what is being done in what order. This might be
> an extreme example (you probably don't need parentheses around the power operation, for example).
> But getting in the habit of using parentheses when you aren't 100% sure how the expression will be calculated
> will save you time and effort later.

### Give a String

In addition to numbers, a _literal_ can be a group of characters -- known as a **String**.

A _string literal_ is always encloses in double quotes. Examples are:

- `"Hello World"` - a typical character string
- `"   "` - a string of spaces
- `""` - an empty string

#### Of Cons and Cats

The `+` operator has a special purpose when it comes to strings. It combines two strings together.
This is called **concatenation**.

For example:

<pre>
PRINT "Hello" + "World"
HelloWorld

Ready.
<cursor>_</cursor>
</pre>

You see that unless you put a space into one of your strings, the concatenation will not insert one,
so you need to pay attention.

Now that you know about literals and expressions, it's time to learn how to store them and their results.

## Variable Nature

(variables)

### To LET or not to LET

### Know Your Numbers

numbers vs integers

### Stringing Along

strings

### A Vast Array

arrays

## Function Junction

## Acting Output

### Put It Together

### Hanging On

## Stringing Together

## Gathering INPUT

## Critical Condition

(if/then)

### True or False?

0 vs 1, conditional operators

### It's Very Logical

logical operators

### Just Go

THEN <line>

### Know Your Limits

THEN applies to the end of the line.

## Thrown for a Loop

### You've Seen This Before

(building loops with GOTO and )

### Who's Next?

(for/to/next)

### Watch Your Step

(step)

## Do You Have Any Comment?

(comments, rem and back-tick)

## Reading Comprehension

(read and data)

### Needs Restoration

(restore)

### Literal Data

(discussion of data strings without quotes)

## Routine Maintenance

(subroutine theory)

### Out and Back

gosub and return

### Reported Side Effects

messing with variables inside/outside subroutines

## Where To Next?

- [weBASIC Language Reference](reference/)
- [Home](index)
