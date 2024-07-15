---
layout: default
title: Your First Program
nav_order: 3
---

# Your First Program

The point of weBASIC is to let you tell your computer to do something.

You may already have tried out [doing this directly](getting-started.md), but if you want to 
do anything truly interesting, you'll need to write a _program_.

A **PROGRAM** is a set of instructions for the computer to execute in some specific order.

Let's get started!

- [**Mode Operandi** - understanding weBASIC modes](#mode-operandi)
- [**Taking a Hard Line** - understanding line numbers](#taking-a-hard-line)
- [**Say Hello** - running your first program](#say-hello)
- [**Save Yourself** - saving your program for later](#save-yourself)
- [**Starting Anew** - clearing your program](#starting-anew)
- [**Bring That Back** - (re)loading your program](#bring-that-back)
- [**What Did You Say?** - getting user input](#what-did-you-say)
- [**Remember Me** - using variables](#remember-me)
- [**A Calculated Move** - your first _useful_ program](#a-calculated-move)
- [Where To Next?](#where-to-next)

## Mode Operandi

When you start weBASIC, you will see this:

<pre>
weBASIC v0.5

READY.
<cursor>_</cursor>
</pre>

This is actually one of the **operating modes** of weBASIC.

### Staying LIVE

The default mode for weBASIC is the **LIVE mode**. In this mode you can issue BASIC commands
and they are executed immediately. You may have already tried typing:

```
PRINT "Hello World"
```

Which results in:

<pre>
PRINT "Hello World"
Hello World

READY.
<cursor>_</cursor>
</pre>

You might notice that the command `print` changes to `PRINT`. weBASIC recognizes words that are
part of the language and converts them to ALL CAPS automatically.

{: .note-title }
> When You're In Error
> 
> When you are in LIVE mode and type in a command that weBASIC cannot execute, you will get an error.
> 
> weBASIC provides an error message (most commonly `SYNTAX ERROR`) and will place the command with the
> error after the next prompt. The location where the error was detected is highlighted with a wavy
> red underline.
> 
> Let's say you used single quotes instead of double quotes around your message, like:
> 
> <pre>print 'Hello World'</pre>
>
> weBASIC will respond with:
> 
> <pre>PRINT 'Hello World'<br/>ERROR: Syntax Error at position 6<br/><br/>READY.<br/>PRINT <error>'Hello</error> World'</pre>
>
> You can fix your error (the moment you type anything the error highlight will disappear), or if
> you'd prefer to retype it entirely, press the _control_ (or CONTROL or CTRL) key and the _D_ key
> at the same time to delete the line (or at least all of the line to the right of the cursor).

Executing commands in LIVE mode can be useful, but it is going to get tiring having to re-type
commands all the time.

So let's put a _line number_ in front of the command, which means you want it to be part of a program.

<pre>
10 PRINT "Hello World"
</pre>

Then hit the return (or ENTER) key.

- [more information about LIVE mode](reference/modes#live-mode)

### An EDIT Tutorial

Everything just changed! Welcome to **EDIT mode**.

In EDIT mode, the screen is split. Most of the screen, the top portion, is your program editor.
THe bottom two lines of the screen are special. They consist of a status bar (shown in reverse
colors) and a command entry line.

<pre>
<lno>10</lno> <keyw>print</keyw> <str>"Hello World"</str>




<rev>weBASIC 0.5 EDIT mode</rev>
</pre>

You might also notice that the text is colored. In EDIT mode, weBASIC highlights important code
to make it easier to understand. For example, <keyw>keywords</keyw> are in an orange color.

- [more information about EDIT mode](reference/modes#edit-mode)

## Taking a Hard Line

For now, let's talk about _why_ you ended up in EDIT mode.

The reason is that you put your command after a *line number*.

The BASIC language (well _most_ BASIC languages) require that you put a line number before each
statement (or set of statements). This line number tells weBASIC:

1. The order in which to execute lines of code
2. A _reference_ to be used by certain statements that accept a line number

{: .note-title }
> Some Terminology
> 
> There are a few terms that are worth getting familiar with early on.
> 
> A **Command** typically tells the computer to do something immediately (which means it will work
> in LIVE mode).
> 
> A **Statement** _also_ tells the computer to do something, but unlike Commands, these must be
> part of a program. A few Commands are also able to be used as Statements. No Statement can be
> run in LIVE mode.
> 
> A **Function** will always return a value.
> 
> A **Parameter** is a value that is used by Commands, Statements, and Functions to specify more
> exactly what needs to be done. For example, the `PRINT` statement takes a parameter consisting
> of what to print.
> 
> An **Operator** can either combine the preceding and following values in some way (called a "binary"
> operator because it applies to two values), or modifies the following value (called a "unary"
> operator since it applies to just one value).
>
> All this to say that if you saw something referred to elsewhere as a "command", and now you
> see it referred to as a "statement", this is because when we are talking about a program,
> we are always talking about "statements". If we are talking about LIVE mode, we are talking
> about "commands".

### Jump! Jump! Jump!

So, our program has one line:

<pre>
<lno>10</lno> <keyw>print</keyw> <str>"Hello World"</str>
</pre>

It's pretty easy to figure out which line is going to be executed first.

So let's add another. Enter:

<pre>
<lno>20</lno> <keyw>goto</keyw> <num>10</num>
</pre>

Then hit the return (or ENTER) key. You must do this for every line of BASIC code in order to
put it into the program. If you type the line and move the cursor off of it without hitting
return (or ENTER) the line might _look_ like it is in the program, but it isn't.

Since 20 is greater than 10, line 20 will be executed _after_ line 10.

{: .note-title }
> Implied Entry
>
> When first learning about using a computer, particularly learning to interact with a computer
> through typing, there is a tendency to specify every keypress. So far you've been instructed
> to hit return (or ENTER) after every command and line of code.
> 
> But you get that now, right? No need to keep telling you what should quickly become second
> nature.
> 
> The return (or ENTER) key is what sends the command or code line you typed to the computer
> to be processed. Skip that and nothing happens.

### Get Going

It should be pretty clear that `GOTO` is going to "jump" execution to the line specified. One
of the good things about BASIC is that its commands and statements are -- _for the most part_ --
easy to understand.

So:

<pre>
<lno>20</lno> <keyw>goto</keyw> <num>10</num>
</pre>

means that the next line to execute is going to be line 10. Go to (line) 10.

And after line 10 executes, it will move on to the next line (i.e. the next line with a line number
greater than the current line).

That happens to be line 20 again.

And line 20 says to go back to line 10.

```mermaid
flowchart TD
    line1(10 PRINT "Hello World")
    line2(20 GOTO 10)
    line1 --> line2
    line2 --> line1
```

Repeat forever.

{: .note-title }
> To Infinity and Beyond
> 
> A sequence of instructions that is repeated over and over without any way of stopping it
> is known as an "infinite loop". A loop like this can be dangerous as it might prevent the
> computer from doing anything else.
> 
> If you've ever been browsing and get a warning that a page has become unresponsive, it is
> very likely some code running on that page has gone into an infinite loop.

## Say Hello

So you have your first program. Time to execute it.

In BASIC, you execute a program by using the `RUN` command.

But you're in EDIT mode, how do you execute a command?

### The Other Half

At the bottom of the EDIT mode screen are two lines. The line in reverse colors is a status line.
It is used to show error messages and things like that.

The very bottom line is the **Command Line**.

To activate it, press the esc (or ESC or ESCAPE) key (which is almost always in the top left corner
of your keyboard). You should notice that the blinking cursor should vanish in the upper portion
of the screen (where your program was being edited) and now appear at the bottom of the screen.

You can now enter commands, similar to what you could do in LIVE mode.

So, on the command line, you can enter `RUN`:

<pre> 
<lno>10</lno> <keyw>print</keyw> <str>"Hello World"</str>
<lno>20</lno> <keyw>goto</keyw> <num>10</num>



<rev>weBASIC 0.5 EDIT mode</rev>RUN<cursor>_</cursor>
</pre>

And the moment you hit return, "Hello World" will start filling the screen.

<pre>
Hello World
Hello World
Hello World
Hello World
Hello World
Hello World
Hello World
Hello World
Hello World
</pre>

_Congratulations_! You're written and run your first program!

{: .note-title }
> Is Nothing Happening?
> 
> You might notice that once the screen is filled with "Hello World", nothing more happens.
> 
> That isn't _technically_ true. The program is still running, and "Hello World" is being
> PRINTed to the screen over and over. However, when it is printed on the last line of the
> screen, the whole screen shifts up one line to open space to print the message again.
> 
> Typically, this shift up one line (called "scrolling") happens fast enough that you can't
> see it. As a result, even though the program is printing line after line of "Hello World"
> nothing appears to change.

### Breaking Out

Unless you are happy to watch "Hello World" on your screen forever, you're probably going to
want to stop your program.

But your program wasn't written to have any place to actually stop. It is in an infinite loop.

To stop your program at any time, hit the esc (or ESC or ESCAPE) key. This will happen:

<pre>
Break in line 10

READY.
<cursor>_</cursor>
</pre>

You're back in LIVE mode, and the program has stopped. You might see "Break in line 20"
instead. It all depends on the timing of which statement was being executed when you hit 
the escape key.

## Save Yourself

So you've written your first program. You should immortalize that somehow.

Not long ago you went from running individual commands from LIVE mode to writing a program
in EDIT mode. You did this so you could do more than just one command at a time. To put it
another way, you wrote a program, in part, so you could build up a _memory_ of the commands 
you had been running one at a time.

Now you need a way to build a _memory_ of the programs you write so you can come back to
them later.

You do this by **saving** the program.

You can do this with the `SAVE` command:

<pre>
SAVE "hello"
</pre>

This will save your program to storage.

{: .note-title }
> Where _IS_ Storage?
> 
> The answer to this question depends on the version of weBASIC you are running and how you
> set it up when you first installed it.
> 
> If you are using the Embedded version of weBASIC, "storage" is actually a space reserved
> on your computer that is managed by your web browser (such as Chrome or Safari or Edge).
> 
> If you are using the Personal version of weBASIC, "storage" is on your computer's file system.
> When you first start up Personal weBASIC, you are asked to choose a folder on your file system
> to be the "root". All programs (and other files) written by and read from weBASIC will be
> in this folder or folders under it.
> 
> If you don't fully understand this, that's fine. All that is important to understand is that
> your program is saved somewhere on your computer. This also means your program is only
> available to you (and anyone you might choose to let play with weBASIC on your computer)

You should see something like this:

<pre>
SAVE "hello"
File Saved

READY.
<cursor>_</cursor>
</pre>

That's all there is to it. Your program is now saved away and safe.

## Starting Anew

You can see that your program is still available by going back to EDIT mode. You remember how,
right?

<pre>EDIT</pre>

And you're back to viewing your program:

<pre>
<lno>10</lno> <keyw>print</keyw> <str>"Hello World"</str>
<lno>20</lno> <keyw>goto</keyw> <num>10</num>



<rev>weBASIC 0.5 EDIT mode</rev>
</pre>

You've saved it, though. So why keep it around? Let's get rid of it so we can move on.

Hit the escape key (esc, ESC, ESCAPE) to get back to the EDIT command line, and then type:

<pre>
NEW
</pre>

Your program should vanish!

<pre>





<rev>weBASIC 0.5 EDIT mode</rev><cursor>_</cursor>
</pre>

You're all set to start working on something new.

## Bring That Back!

But what if you wanted to show off that amazing "Hello World" program again?

All you need to do is load it back in.

Since we're already on the command line for EDIT mode, let's do that from here.

Type:

<pre>
LOAD "hello"
</pre>

And you should see:

<pre> 
<lno>10</lno> <keyw>print</keyw> <str>"Hello World"</str>
<lno>20</lno> <keyw>goto</keyw> <num>10</num>



<rev>2 BASIC lines loaded</rev>RUN<cursor>_</cursor>
</pre>

Your program is back!

Also, notice how the status line for the EDIT mode gives you a message confirming the LOAD command.

It turns out there is no further need for that program, at least not right now. Perhaps later you
can go back and change it to your liking.

Right now, however, it is time to write another program. One that does something a little more
useful.

So get rid of the current program again. (That's the `NEW` command.)

Time to have the computer do a little math for you...

## What Did You Say?

You might [already have tried](getting-started#a-calculated-tutorial) out using `PRINT` to 
get the answers to some math equations.

What if you wanted to help someone else calculate something? Maybe someone who has no interest
in learning a little BASIC?

Let's take the example of raising one number to the power of another number. For example,
raising 3.5 to the power of 7.2. 

In BASIC, this would be:

<pre>
PRINT 3.5^7.2
8265.895667991475

READY.
<cursor>_</cursor>
</pre>

Easy for you. You know BASIC.

But your friend doesn't and doesn't want to. So you need to ask them.

For that, you will use the `INPUT` statement. Let's write that up:

<pre>
<lno>10</lno> <keyw>PRINT</keyw> <str>"Enter the number you want to raise to a power"</str>
<lno>20</lno> <keyw>INPUT</keyw> <var>base</var>
</pre>

Let's just `RUN` this part and see what happens:

<pre>
Enter the number you want to raise to a power
? <cursor>_</cursor>
</pre>

If you type in `3.5` and hit return (or ENTER), you'll end up back in EDIT mode.

Nothing seemed to happen.

But that isn't quite true.

Let's check something out.

## Remember Me

Since you should already be in the EDIT command mode, type

<pre>
LIVE
</pre>

This will bring you back to LIVE mode.

Now try entering this command:

<pre>
PRINT base
</pre>

You should see something like:

<pre>
PRINT base
3.5

READY.
<cursor>_</cursor>
</pre>

{: .note }
> If you happened to enter a different value when you ran the program earlier, 
> that should be the value you see.

`base` is called a **variable**. A variable stores values for later use. If you've ever done
algebra, you've seen variables:

> y = x + 3. Solve for x

<tt>x</tt> and <tt>y</tt> are variables. In algebra there are often described as placeholders.
They hold the place of a number to be filled in later.

BASIC variables also do that -- the one key difference is usually, instead of solving an equation
to find the value, you set the values of the variables and use them to solve the equation. 

{: .note-title }
> What's In a Name?
> 
> In algebra, variable names are almost always <tt>x</tt>, <tt>y</tt>, or <tt>z</tt>. Sometimes
> <tt>a</tt>, <tt>b</tt>, or <tt>c</tt> are used (as in the pythorean theorum: 
> <tt>a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup></tt>).
> 
> The original BASIC allowed variables to be named either as a single letter (like `A`, `B`, `X`, etc)
> or a letter followed by a single digit (like `A1`, `B2`, `X8`, etc). Many BASICs that followed
> expanded this to be a letter, optionally followed by either a number or another letter. 
> But the maximum variable name length was still 2 characters.
> 
> This made for a great deal of cryptic code. A variable like `SM` could mean a "sum", or 
> "smoothing factor", or "starting men" for a game.
> 
> weBASIC allows variable names to be of any length, using upper and lowercase letters, numbers
> and underscores (_). As long as the variable starts with a letter, it's good.
> 
> So make use of nice, descriptive variable names.

### Being Prompt

We've asked for the base number, now we need to ask for the power.

Let's do this using a variation of the `INPUT` statement that includes a _prompt_:

<pre>
<lno>30</lno> <keyw>INPUT</keyw> <str>"Enter the power to raise to"</str>;<var>power</var>
</pre>

If you put a message (in quotes -- just like `PRINT`) before the variable you want the
user to input, that message will be displayed. The semicolon (;) separates your message
from the variable you want to fill in.

You can see this by `RUN`ing just this one line. (Be sure to hit the escape key to get
back to the EDIT command line.)

<pre>
RUN 30
</pre>

In this way we've asked weBASIC to start executing on line number 30, rather than from the
first line of the program.

The result will be:

<pre>
Enter the power to raise to? <cursor>_</cursor>
</pre>

You can respond by typing in `7.2` (and hitting return to enter it in).

You're back to EDIT mode again. If you want, you could go back to `LIVE` mode and `PRINT power`
to see the value of that variable as well.

### Clean Up On Line 20

Now that you know how, it seems like lines 10 and 20 could be collapsed into a single line, right?

You can do this by going to `EDIT` mode. If you are on the command line, hit the escape key
to go back to the code editor.

Now, on an empty line you can type:

<pre>
<lno>10</lno> <keyw>INPUT</keyw> <str>"Enter the value you want to raise to a power"</str>;<var>base</var>
</pre>

When you enter this line, you will see:

<pre>
<lno>10</lno> <keyw>INPUT</keyw> <str>"Enter the value you want to raise to a power"</str>;<var>base</var>
<lno>20</lno> <keyw>INPUT</keyw> <var>base</var>
<lno>30</lno> <keyw>INPUT</keyw> <str>"Enter the power to raise to"</str>;<var>power</var>
</pre>

Re-entering line number 10 automatically replaces the existing one. You could have moved the cursor
up to line 10 and modified it there. If you are making small changes to a code line, that is the
best way to do it. But if you need to replace a line entirely, it might be easier to just type
it in again (as you did here) and replace it that way.

There's a problem now though: we are `INPUT`ing `base` twice. Line 20 has to go.

Move your cursor to after the number 20 on that line:

<pre>
<lno>10</lno> <keyw>INPUT</keyw> <str>"Enter the value you want to raise to a power"</str>;<var>base</var>
<lno>20</lno><cursor>_</cursor><keyw>INPUT</keyw> <var>base</var>
<lno>30</lno> <keyw>INPUT</keyw> <str>"Enter the power to raise to"</str>;<var>power</var>
</pre>

Now press the control (or CONTROL or CTRL) key and the 'D' key at the same time. This will delete
everything on the line to the right of the cursor. The result should be:

<pre>
<lno>10</lno> <keyw>INPUT</keyw> <str>"Enter the value you want to raise to a power"</str>;<var>base</var>
<lno>20</lno><cursor>_</cursor>
<lno>30</lno> <keyw>INPUT</keyw> <str>"Enter the power to raise to"</str>;<var>power</var>
</pre>

Now, press the return key. The result is:

<pre>
<lno>10</lno> <keyw>INPUT</keyw> <str>"Enter the value you want to raise to a power"</str>;<var>base</var>
<lno>30</lno> <keyw>INPUT</keyw> <str>"Enter the power to raise to"</str>;<var>power</var>
</pre>

You've just deleted line 20! Entering a line number by itself removes that line (if it exists)
from the program.

{: .note-title }
> Don't Mind the Gap
> 
> You might have noticed that the example program started on line 10, not line 0 or 1. 
> Then the next line was 20, and the next 30.
> 
> Because weBASIC requires every line to have a line number, it is always good practice to
> leave some gap in the numbers used for lines, just in case you might need to go back and
> insert a new line later. Renumbering lines in weBASIC (and in _most_ BASICs) is tricky
> at best.
> 
> In that light, deleting line 20 and having only lines 10 and 30 is no big deal. There is
> no requirement to have consistent "gaps" between line numbers, so a bigger gap is just fine.

## An Important Assignment

So, you've got code that asks the user for a `base` number, and a `power` to raise it to.

Now you need to calculate the result for them.

Enter this line:

<pre>
<lno>40</lno> LET <var>result</var> = <var>base</var>^<var>power</var>
</pre>

{: .note-title }
> You Have the Power
> 
> In the event you didn't [mess around with calculations](#getting-started#a-calculated-tutorial)
> the caret (^) symbol represents the mathematical operator for "raise to the power of".

The `LET` statement is for **Assignment**. You have assigned the result of the equation of raising
`base` to the power of `power` to the variable `result`.

If you `RUN` your program now, you can enter a value for both the `base` and `power` and then,
like before, you'll be right back in EDIT mode. You could pop over to `LIVE` mode and
`PRINT result` to get your answer.

## A Calculated Move

Why do that when you can make that part of your program. Time to add another line:

<pre>
<lno>50</lno> PRINT "The answer is: ";result
</pre>

## Pause for Effect

You _could_ run your program now, but you should know what is going to happen.

You are going to enter in the `base` and the `power`, and before you have the slightest chance
to see the `result` you'll be back in EDIT mode looking at your program code.

So let's use what we've learned so far to make the program pause. Try adding these lines:

<pre>
<lno>60</lno> <keyw>PRINT</keyw>
<lno>70</lno> <keyw>INPUT</keyw> <str>"Hit return to end"</str>pause
</pre>

Do you see what was done here?

First we `PRINT` a blank line. We don't need any _parameters_ for `PRINT` to do that. Printing
nothing will simply move to the next line, leaving a blank line behind.

Next we `INPUT` a variable `pause`. But the fact is that we don't care what the value of
`pause` is. When we ran our program earlier, when it asked for a value, it waited until we
hit the return key to continue. So why not use `INPUT` to wait for that return key? In the
meantime, the result is being displayed.

{: .note-title }
> Did You Miss Something?
> 
> Did you notice that for that last `INPUT` there wasn't a semicolon (;) between the
> prompt and the variable?
> 
> In weBASIC if you skip the semicolon it won't print a question mark (?) following the
> prompt.

Now, give it a `RUN` and try it out.

<pre>
Enter the number you want to raise to a power? 3.5
Enter the power to raise to? 7.2
The answer is: 8265.895667991475

Hit return to end<cursor>_</cursor>
</pre>

With that, you have a program that can provide something useful to a user. Maybe not the
most useful thing in the world, but useful nonetheless.

You should save it for later:

<pre>
SAVE "power"
</pre>

## Where to Next?

The most useful purpose of your program, however, was teaching you a little about how to 
write a program in BASIC.

That's a great stepping off point for [diving deeper into the language](#language).

- [Home](index)
- [Getting Started - _in case you missed it_](getting-started)
- [Learn the weBASIC Language](language)
- [weBASIC reference](reference/)

