# weBASIC
A BASIC interpreter/live OS that is both retro and modern

- [ ] LIVE mode
  - [x] Screen autosizing to fit
  - [x] Divide screen into character cells
  - [x] Intro message
  - [x] Cursor
  - [x] Key entry
  - [x] Line limited to 160 chars
  - [x] Backspace
  - [x] Arrows left/right
  - [x] Insert at cursor
  - [x] Ctrl left/right - SOL/EOL
  - [x] Ctrl-I toggle insert/overwrite mode
  - [x] Overwrite mode
  - [ ] Enter for new prompt
  - [ ] Scroll to fit new command input
  - [ ] Up/Down to insert buffered lines
  - [ ] Alt left/right - start of/end of current/prev/next word
  - [ ] Key repeat
  - [ ] Highlight error (wavy underscore)
  - [ ] Allow typeover error
- [ ] Interpreter
  - [ ] String literal
  - [ ] PRINT
  - [ ] Auto-capitalize reserved words
  - [ ] Update command line on interpret to show auto-cap
  - [ ] Get parsing error
  - [ ] Update command line on error to show error
- [ ] Live interpret PRINT "Hello World"

NOTES:
* Sometime in the future need to implement UNDO/REDO on inputs (CTRL-z - UNDO, CTRL-SHIFT-Z - redo)
