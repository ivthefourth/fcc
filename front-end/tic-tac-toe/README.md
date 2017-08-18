# Tic Tac Toe
[Live Link](https://ivthefourth.github.io/fcc/front-end/tic-tac-toe/)

## About
A single-player Tic Tac Toe game against custom computer logic. I decided to challenge myself to create an unbeatable computer (hard mode) without doing any research. 

The first thing I thought about was the symmetry of the board: vertical, horizontal, and two diagonal lines of symmetry exist. Considering this symmetry, certain moves at certain times can be considered the same as a number of other moves. For example, there are only 3 real choices on turn number one: center, side, and corner. This significantly reduces the total number of branches in a tree displaying every outcome of the game.

I could use this tree to have the computer always choose the most optimal square (eliminate chance to lose and maximize chance to win) in a given situation, but I wanted to see if there was a more general approach I could take without mapping out every move for the computer. 

This is when I came up with a more general logic. The way this logic works is by looping once through all the squares. For each square that hasn't already been taken, it will check the lines containing this square to see if the square meets certain criteria. The criteria are as follows:
* This square would complete a line for either the computer or the user, resulting in a win/loss
* Two lines containing this square have one square taken each, and that square was chosen by the computer. This is an offensive move, the rest are primarily defensive. 
* Three lines containing this square have one square taken each. Two of these are owned by the user and one by the computer. 
* Two lines containing this square have one square taken each, and that square was chosen by the user. 
* One line containing this square has one square taken by the computer.

These criteria are listed in the order that they are to be considered. Items later in the list are only considered if none of the previous situations exist. If none of the above situations exist, a random available square is chosen. 

This logic worked well enough that I used it for the normal difficulty, but there were some specific cases that needed improvement. 

For the unbeatable computer logic, I ended up combining the tree logic for some of the early game with the more general logic to create an optimal computer player that never loses and tries to win as much as possible. The one exception is that on the first move, the computer will sometimes choose the center square, which is not the optimal choice. I did this to mix things up a bit.  
