10 PRINT "HANGMAN":PRINT
20 PRINT "setting up..."
49 ` pick a word
50 wordIndex = RND(100)
60 FOR x = 1 TO wordIndex
70 READ word$
80 IF word$ = "XENDX" THEN RESTORE:READ word$
90 NEXT
99 ` set up gallows
100 DIM gallows$(6,8):RESTORE 3000
110 FOR e = 0 TO 6:FOR r = 1 TO 8
120 READ gallows$(e, r)
130 NEXT:NEXT
199 ` set up game state
200 DIM guesses$(26)
210 DIM wordState$(LEN(word$))
220 errors = 0
230 correctGuesses = 0
299 ` render gallows
300 PRINT:PRINT:PRINT:PRINT
310 FOR r = 1 TO 8:PRINT gallows$(errors, r):NEXT
319 ` render word
320 PRINT
330 FOR l = 1 TO LEN(word$)
340 IF wordState$(l) = "" THEN PRINT "_";:ELSE PRINT wordState$(l);
350 PRINT " ";
360 NEXT
370 PRINT
380 IF errors < 6 THEN 400
390 PRINT:PRINT"Word was ";word$:PRINT:PRINT "YOU LOSE":GOTO 800
399 ` GET INPUT
400 PRINT "Guessed: ";:FOR x = 1 TO 26:PRINT guesses$(x);" ";:NEXT:PRINT
410 INPUT "Guess";guess$
420 guessLetter$ = LEFT$(guess$, 1)
430 IF guessLetter$ = "" THEN 400
439 ` make sure it is a capital letter
440 lc = ASC(guessLetter$)
450 IF lc >= 97 AND lc <= 122 THEN lc = lc - 32
460 IF lc < 65 OR lc > 90 THEN 400
470 guessLetter$ = CHR$(lc)
479 ` make sure no duplicate guesses
480 x=1
490 IF x > 26 OR (guesses$(x) = "") THEN 520
500 IF guesses$(x) = guessLetter$ THEN 400
510 x = x + 1:GOTO 490
520 guesses$(x) = guessLetter$
530 FOR x = 1 TO 26:PRINT guesses$(x);" ";:NEXT:PRINT
599 ` FILL in word OR mark error
600 found = 0:correct = 0
610 FOR x = 1 TO LEN(word$)
620 IF MID$(word$, x, x+1) <> guessLetter$ THEN 640
630 found = 1:wordState$(x) = guessLetter$
640 IF wordState$(x) <> "" THEN correct = correct + 1
650 NEXT
660 IF NOT found THEN errors = errors + 1
670 IF correct < LEN(word$) THEN 300
680 PRINT:PRINT:PRINT
690 PRINT "Word was ";word$
700 PRINT:PRINT "YOU WIN!"
800 PRINT:INPUT "ENTER to end" a$
999 END
1000 DATA HELLO,THERE,WORLD,FUMBLE,THIMBLE,YACHT,HATCH
1010 DATA THOUGHT,FRANK,LILY,WOULD,TOWEL,UNDEAD,HEIGHT
1020 DATA MARKSMAN,UMBER,YELLOW,HYENA,EDITOR,KNOBBY
1030 DATA ALCHEMY,BUSHEL,CARAVAN,DYNAMIC,ELOPE,FOREIGN
1040 DATA GROVEL,HELPER,INDECENT,JUMPER,KNEECAP,LOUSY
1050 DATA MACHINE,NOBODY,OBSIDIAN,PEOPLE,QUILTED,ROTTER
1060 DATA SOMEBODY,TRUNK,UNDERLIE,VERIFY,WHITTLE,XEROX
1070 DATA YOUTHFUL,ZEBRA
2000 DATA XENDX
3000 DATA "+--+ ","|    ","|    ","|    ","|    ","|    ","|    ","|____"
3001 DATA "+--+ ","|  O ","|    ","|    ","|    ","|    ","|    ","|____"
3002 DATA "+--+ ","|  O ","|  | ","|  | ","|    ","|    ","|    ","|____"
3003 DATA "+--+ ","|  O ","| /| ","|  | ","|    ","|    ","|    ","|____"
3004 DATA "+--+ ","|  O ","| /|\","|  | ","|    ","|    ","|    ","|____"
3005 DATA "+--+ ","|  O ","| /|\","|  ^ ","| /  ","|    ","|    ","|____"
3006 DATA "+--+ ","|  O ","| /|\","|  ^ ","| / \","|    ","|    ","|____"