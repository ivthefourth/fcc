
//randomly returns true or false
function randBool(){
	return Math.floor(Math.random() * 2) === 1;
}

//returns a random item from an array 
function randItem(arr){
	var i = Math.floor( Math.random() * arr.length );
   return arr[i];
}


//Each line is one way to win (connecting three squares)
function Line(squareIndexes, squares){
	//number of squares containing an X
	this.x = 0;
	//number of squares containing an O
	this.o = 0;
	//squares contained in this line (by index)
	//no, use map to get this as an array of square objects...
	//also push this line onto that square's lines array
	this.squares = squareIndexes.map(function(i){
		squares[i].lines.push(this);
		return squares[i];
	}.bind(this));
}
Line.prototype.resetForNewGame = function(){
	this.x = 0;
	this.o = 0;
}
//returns whether the line is a winning line (three of x or o)
Line.prototype.isCompleted = function(){
	return this.x === 3 || this.o === 3;
}


//each square of the game: X, O or null
function Square(id, callback){
	this.id = id;
	this.token = null;

	//lines that contain this square (by index)
	this.lines = [];

	//set square type based on id (position on board)
	if( id === 4)
		this.type = 'center';
	else if( id % 2 === 0)
		this.type = 'corner';
	else
		this.type = 'side';

	//set event listeners
	this.element = document.getElementById('square-' + id);
	this.element.onclick = function(e){
		callback(id);
	}
	this.element.onkeydown = function(e){
		//space and enter/return
		if( e.keyCode === 32 || e.keyCode === 13){
			callback(id);
		}
	}
	this.element.addEventListener('touchstart', function(e){
		e.preventDefault();
		callback(id);
	});
}
Square.prototype.resetForNewGame = function(){
	this.token = null;
}


function Game(id){
	//bind methods that are called as callbacks
	this.doComputerTurn = this.doComputerTurn.bind(this);
	this.doUserTurn = this.doUserTurn.bind(this);
	this.showGameOver = this.showGameOver.bind(this);


	//number of games played
	this.gameCount = 0;

	//track number for current turn, a turn is one play from either player
	//not one play from both as one might expect. this is used for computer
	//strategy.
	this.currentTurnNumber = 1;

	//stores the 'type' of the first turn, one of 'side', 'center', or 'corner'
	//used for computer strategy 
	this.firstChoice = null;

	//when true, user input is allowed 
	//prevents user from accidentally playing before seeing computer's move
	this.userCanPlay = false;

	//difficulty of 1 is normal, difficulty of 2 is hard (impossible to win)
	this.difficulty = 1; 

	this.winner = 'draw';
	this.squares = [];
	this.lines = [];


	//make squares
	//move some or all of this into square constructor 
	for( var i = 0; i < 9; i++){
		this.squares.push(new Square(i, this.doUserTurn));
	}

	//relativeBoard is the board flipped to a certain orientation
	//contains indices of squares for this orientation 
	//change this to have squares
	this.relativeBoard = [
		this.squares.slice(0,3),
		this.squares.slice(3,6),
		this.squares.slice(6,9)
	];

	//make lines (each line is one way to win, if all squares have same token)
	this.lines.push( new Line( [0, 1, 2], this.squares ));
	this.lines.push( new Line( [3, 4, 5], this.squares ));
	this.lines.push( new Line( [6, 7, 8], this.squares ));
	this.lines.push( new Line( [0, 3, 6], this.squares ));
	this.lines.push( new Line( [1, 4, 7], this.squares ));
	this.lines.push( new Line( [2, 5, 8], this.squares ));
	this.lines.push( new Line( [0, 4, 8], this.squares ));
	this.lines.push( new Line( [2, 4, 6], this.squares ));

}
Game.prototype.setDifficulty = function(difficulty) {
	//should be 1 for normal or 2 for impossible 
	this.difficulty = difficulty;
}
//is user playing as X or O?
Game.prototype.setUserToken = function(token){
	//only set it once
	if(!this.userToken){
		//x goes first, so player can play
		if( token === 'x'){
			this.computerToken = 'o';
			this.userToken = 'x';
			this.userCanPlay = true;
			document.getElementById('board').className = 'player-is-' + this.userToken;
		}
		//o goes second, so computer plays
		else{
			this.computerToken = 'x';
			this.userToken = 'o';
			setTimeout(this.doComputerTurn, 600);
		}
	}
}
//claim a square as given token (X or O)
Game.prototype.chooseSquare = function(square, token){
	square.token = token;
	//update given token's count for lines conaining this square 
	square.lines.forEach(function(line){
		line[token] += 1;
	});
	//update ui
	square.element.className += ' has-' + token;
}
//strategy for computer to never lose and try to win as possible 
//remember that before this function is called, the computer will check for any lines 
//that can be completed to win or that need to be blocked to prevent user from winning
Game.prototype.strategy = function(userChoice){
	var x, y, square;
	//note: switch has no breaks, because each case will return something
	switch( this.currentTurnNumber ){
		//if computer has first move, randomly choose between center square or a corner
		case 1:
		   //50% chance
			if(randBool()){
				//for both rows and collumns, choose a random side (left/right or top/bottom)
				//result is a corner square 
				x = randBool() ? 0 : 2;
				y = randBool() ? 0 : 2;
				square = this.relativeBoard[y][x];

				//using symmetry, reorient the board so that the chosen corner 
				//appears on the top right ([0, 2]) of the relative board (doesn't change UI
				//this is to use for the computer to make optimal move choices)
				while( this.relativeBoard[0][2] !== square){
					this.flipBoard('vertical');
					if( this.relativeBoard[0][2] !== square)
						this.flipBoard('horizontal');
				}
				//store first choice type
				this.firstChoice = 'corner';
				return square;
			}
			else{
				//pick the center square and store first choice type 
				this.firstChoice = 'center';
				return this.relativeBoard[1][1];
			}
		//if user went first, computer has turn 2
		case 2:
		   //if the user chose a corner
			if( userChoice.type == 'corner' ){
				//reorient the board for computer (see case 1 for more info)
				while( this.relativeBoard[0][2] !== userChoice){
					this.flipBoard('vertical');
					if( this.relativeBoard[0][2] !== userChoice)
						this.flipBoard('horizontal');
				}
				//store first choice type
				this.firstChoice = 'corner';
				//choose center, not choosing center means possible, unpreventable loss
				return this.squares[4]; 
			}
			//if the user chose a side, 
			else if( userChoice.type == 'side' ){
				//reorient the board so that the chosen side square is on the top
				while( this.relativeBoard[0][1] !== userChoice){
					this.flipBoard('positiveDiagonal');
					if( this.relativeBoard[0][1] !== userChoice)
						this.flipBoard('negativeDiagonal');
				}
				//store first choice type 
				this.firstChoice = 'side';
				//computer should pick a corner adjacent to the user's choice
				//gives a decent chance to win if user plays poorly
				//we choose the top right corner on the relative board (to avoid reorienting again)
				return this.relativeBoard[0][2];
			}
			//if the user chose the center square
			else{ 
				//computer should pick a random corner, 
				//not choosing corner means possible, unpreventable loss
				x = Math.floor(Math.random() * 2) === 1 ? 0 : 2;
				y = Math.floor(Math.random() * 2) === 1 ? 0 : 2;
				square = this.relativeBoard[y][x];
				//reorient the board so the chosen corner is top right
				while( this.relativeBoard[0][2] !== square){
					this.flipBoard('vertical');
					if( this.relativeBoard[0][2] !== square)
						this.flipBoard('horizontal');
				}
				//store first choice type
				this.firstChoice = 'center';
				return square;
			}
		//computer's second move when computer goes first 
		case 3:
			//if the computer's first move chose the center square
			if( this.firstChoice === 'center' ){
				//if the user chose a corner
				if( userChoice.type == 'corner' ){
					//reorient the board so the chosen corner is on the top right
					while( this.relativeBoard[0][2] !== userChoice){
						this.flipBoard('vertical');
						if( this.relativeBoard[0][2] !== userChoice)
							this.flipBoard('horizontal');
					}
					//computer should choose the corner oposite (diagonal from)
					//the corner the user chose (bottom left on relative board)
					return this.relativeBoard[2][0];
				}
				//if the user chose a side
				else{
					//reorient the board so that the chosen side is on the top
					while( this.relativeBoard[0][1] !== userChoice){
						this.flipBoard('positiveDiagonal');
						if( this.relativeBoard[0][1] !== userChoice)
							this.flipBoard('negativeDiagonal');
					}
					//the compuer can choose any available square except for the square 
					//opposite the user's choice (bottom side on relative board)
					//and the computer will win:
					//choose an outer column
					x = randBool() ? 0 : 2; 
					//choose any square in that column
					y = Math.floor(Math.random() * 3);
					return this.relativeBoard[y][x];
				}
			}
			//if the computer didn't choose the center, then it chose a corner
			else{
				//if the user chose a square below the diagonal line 
				//with a positive slope, reorient the board so their choice is 
				//reflected above this line 
				if( userChoice === this.relativeBoard[1][2] || 
					userChoice === this.relativeBoard[2][1] || 
					userChoice === this.relativeBoard[2][2] )
					this.flipBoard('positiveDiagonal');

				//if the user chose the center square, the computer should choose the square
				//opposite (diagonal) from the computer's first move (bottom left on relative)
				//this sets the computer up for a possible win if the player chooses a corner 
				if( userChoice.type == 'center' ){
					return this.relativeBoard[2][0];
				}
				//if the user chose a side, the computer should choose the center and it will win
				else if( userChoice.type == 'side' ){
					return this.squares[4];
				}
				//if the user chose a corner, the computer should choose a corner
				//that is not diagonal from its first choice and it will win
				else{
					return this.relativeBoard[2][2];
				}
			}
		//computer's second move when user goes first 
		case 4:
		   //if the user's first choice was the center, any possible move
		   //can be countered sufficiently with the normal logic 
			if( this.firstChoice === 'center'){
				return null; 
			}
			//if the user's first choice was a side, remember the board reoriented so that
			//the chosen side is on top and the computer chose the top right corner
			else if( this.firstChoice === 'side'){
				//if the user chose a corner that isn't adjacent to their first choice, 
				//then the computer should choose the center square to give it an ok chance to win
				if(userChoice === this.relativeBoard[2][0] || userChoice === this.relativeBoard[2][2])
					return this.squares[4];
				//if the user chose the corner adjacent to their first choice, the computer
				// choose the side adjacent to the computer's first choice and computer will win
				else if( userChoice === this.relativeBoard[0][0] )
					return this.relativeBoard[1][2];
				//if the user chose the left side on relative board,
				//computer should choose bottom right corner and computer will win
				else if( userChoice === this.relativeBoard[1][0] )
					return this.relativeBoard[2][2];
				//if the user chose the side adjacent to the computer's previous choice,
				//the computer should choose the bottom side on relative board for a small win chance
				else if( userChoice === this.relativeBoard[1][2] )
					return this.relativeBoard[2][1];
				//the remaining options can be handled by the normal logic 
				else
					return null;
			}
			//if the user's first choice was a corner, remember that the computer chose center
			else{
				//if the user chose a square below the diagonal line 
				//with a positive slope, reorient the board so their choice is 
				//reflected above this line 
				if( userChoice === this.relativeBoard[1][2] || 
					userChoice === this.relativeBoard[2][1] || 
					userChoice === this.relativeBoard[2][2] )
					this.flipBoard('positiveDiagonal');

				//Note: it seems like choices are missing here, but those choices
				//would be picked up by the normal logic and this function wouldn't be used 
				//if user chose left side of relative board, computer should choose
				//corner opposite (diagonal from) the user's first choice for a small chance to win
				if( userChoice === this.relativeBoard[1][0] )
					return this.relativeBoard[2][0];
				//if user chose the corner opposite the users first choice, commputer should
				//choose any side to block the user from wining, in this case we pick a
				//specific side to make things easy
				else if( userChoice === this.relativeBoard[2][0] )
					return this.relativeBoard[0][1];
			}
		//normal logic will work for all moves beyond move 4 
		default:
			return null;
	}
}
//computer select a square
Game.prototype.doComputerTurn = function(playerChoiceIndex){
	var square = null;
	var i, j;
	//check each line to see if computer can complete it and win
	//chose the winning square if this is possible
	for( i = 0; i < 8; i++){
		if( this.lines[i][this.computerToken] === 2 &&
			this.lines[i][this.userToken] === 0 ){
			for( j = 0; j < 3; j++){
				if( !this.lines[i].squares[j].token ){
					square = this.lines[i].squares[j];
					break;
				}
			}
		}
	}
	//if the computer can't win, check each line to see if the user could win next turn
	//if this is true, select the square to block the user
	//(note: we could use the previous loop to store any user winning lines
	//and not have to loop through each line again here, but it's only 8 lines, so NBD)
	if( square === null ){
		for( i = 0; i < 8; i++){
			if( this.lines[i][this.computerToken] === 0 &&
				this.lines[i][this.userToken] === 2 ){
				for( j = 0; j < 3; j++){
					if( !this.lines[i].squares[j].token ){
						square = this.lines[i].squares[j];
						break;
					}
				}
			}
		}
	}
	//if the computer also doesn't need to block the user from winning, check
	//the omptimal strategy to see if it knows what square should be played
	if( square === null){
		//only use this for the first move on normal mode, or use it through 
		//move 4 on hard mode. Any move beyond move 4 can be handled by the more general
		//logic below
		if( this.currentTurnNumber < 2 || this.difficulty === 2 && this.currentTurnNumber <= 4){ 
			square = this.strategy(this.squares[playerChoiceIndex]);
		}
	}

	if( square === null ){
		//for a given, empty square, these track the number of lines containing that square
		//that have one square containing the computer's token (for compLines) or the user's
		//token (for userLines) and are otherwise empty. 
		var compLines, userLines;

		//arrays to hold squares where compLines and userLines meet certain requirements:
		//cn indicates compLines == n and un indicates userLines == n
		//for example, a square that contains 2 lines that contain one square with a user's token
		//and are otherwise empty as well as one line that contains one square with the computer's 
		//token and is otherwise empty will be pushed into the c1u2 array.
		var c2u0 = [];
		var c1u2 = [];
		var c0u2 = [];
		var c1u0 = [];

		//Go through each square 
		for( i = 0; i < 9; i++){
			compLines = 0;
			userLines = 0;
			//check these conditions for each square 
			//(see variable declarations above for conditions)
			for(j = 0; j < this.squares[i].lines.length && !this.squares[i].token; j++){
				if( this.squares[i].lines[j][this.computerToken] === 1 &&
					this.squares[i].lines[j][this.userToken] === 0 ){
					compLines += 1;
				}
				else if( this.squares[i].lines[j][this.computerToken] === 0 &&
					this.squares[i].lines[j][this.userToken] === 1 ){
					userLines += 1;
				}
			}
			//then push the square into the appropriate array
			if( compLines === 2 )
				c2u0.push(this.squares[i]);
			else if(compLines === 1 && userLines === 2)
				c1u2.push(this.squares[i]);
			else if( compLines === 0 && userLines === 2)
				c0u2.push(this.squares[i]);
			else if( compLines === 1 )
				c1u0.push(this.squares[i]);

		}

		//choose a random square from an array
		//arrays are ordered here from most to least optimal move choice
		if( c2u0.length > 0 ){
			square = randItem(c2u0);
		}
		else if( c1u2.length > 0 ){
			square = randItem(c1u2);
		}
		else if( c0u2.length > 0 ){
			square = randItem(c0u2);
		}
		else if( c1u0.length > 0 ){
			square = randItem(c1u0);
		}
		//if all of the above arrays are empty, choose a random square
		else{
			var available = this.squares.reduce(function(arr, square){
				if( !square.token){
					arr.push(square);
				}
				return arr;
			}, []);
			square = randItem(available);
		}
	}

	//finally choose the square that was provided from all the logic above
	this.chooseSquare(square, this.computerToken);

	//if the game is over, show this to the user (either win or draw)
	if( this.checkForGameOver('computer') ){
		this.showGameOver();
	}
	//otherwise, go to the next move, and allow the user to choose a square
	else{
		setTimeout(function(){
			canFocus( square.element, false);
			this.userCanPlay = true;
			document.getElementById('board').className = 'player-is-' + game.userToken;
		}.bind(this), 300);
		this.currentTurnNumber += 1;
	}
}
//user select a square
Game.prototype.doUserTurn = function(squareIndex){
	var square = this.squares[squareIndex];
	//first make sure user is allowed to play (game is playing and animations have finished)
	//and that the square isn't already taken 
	if( this.userCanPlay && !square.token ){
		//prevent duplicate or unintended inputs until computer's move is displayed
		//and select square
		this.userCanPlay = false;
		this.chooseSquare(square, this.userToken);

		//update ui
		document.getElementById('board').className = '';
		canFocus( square.element, false);

		
		//if won/game over, show user
		if( this.checkForGameOver('user') ){
			this.showGameOver();
		}
		//otherwise go to next turn and have computer play 
		else{
			this.currentTurnNumber += 1;
			var callback = function(){
				this.doComputerTurn(squareIndex);
			}.bind(this);
			setTimeout(callback, 500);
		}
	}
}
Game.prototype.checkForGameOver = function(player){
	//check each line to see if any is completed (winner)
	for( var i = 0; i < this.lines.length; i++){
		if( this.lines[i].isCompleted() ){
			//set winner to the provided player
			//and store winning line so it can be highlighted on interface
			this.winner = player;
			this.winningLine = this.lines[i];
			return true;
		}
	}
	//all squares have been filled but no winner
	return this.currentTurnNumber === 9;
}
Game.prototype.showGameOver = function(){
	//prevent user from focusing (tab) on squares 
	canFocusBoard(false);
	//allow user to focus on play again button
	canFocus(document.getElementById('play-again'), true);

	//update interface... grey out non-winning squares and highlight winning squares (if any)
	document.getElementById('board').className = 'game-over';
	if( this.winner === 'draw'){
		document.getElementById('game-over-text').innerHTML = "You Tie!";
	}
	else if( this.winner === 'user' ){
		document.getElementById('game-over-text').innerHTML = "You Win!";
		for(var i = 0; i < 3; i++){
			this.winningLine.squares[i].element.className += ' winning-square'
		}
	}
	else{
		document.getElementById('game-over-text').innerHTML = "You Lose!";
		for(var i = 0; i < 3; i++){
			this.winningLine.squares[i].element.className += ' winning-square'
		}
	}

	//show end screen with game over text (you win/lose/tie), and play again button
	document.getElementById('game-end-screen').setAttribute('style', 'display: block');
	setTimeout(function(){
		document.getElementById('game-end-screen').className = 'shown';
		this.canPlayAgain = true;
	}.bind(this), 1500);

	//reset squares and lines for new game, interface as well as game data
	setTimeout(function(){
		for( var i = 0; i < 8; i++){
			this.lines[i].resetForNewGame();
		}
		for( i = 0; i < 9; i++){
			this.squares[i].resetForNewGame();
			this.squares[i].element.className = 'square';
		}
	}.bind(this), 1600);
}
Game.prototype.startNewGame = function(){
	//allow user to focus game board
	canFocusBoard(true);
	//prevent user from focussing play again button
	canFocus(document.getElementById('play-again'), false);
	this.canPlayAgain = false;

	//reset game data
	this.winner = 'draw';
	this.currentTurnNumber = 1;
	this.relativeBoard = [
		this.squares.slice(0,3),
		this.squares.slice(3,6),
		this.squares.slice(6,9)
	];

	//track total games played
	this.gameCount += 1;

	//hide game over screen and update board interface
	document.getElementById('game-end-screen').className = 'hidden';
	document.getElementById('board').className = 'game-playing';
	setTimeout(function(){
		document.getElementById('game-end-screen').setAttribute('style', 'display: none');
	}, 500);

	//x goes first for first game played, then they alternate
	//so computer and user take turns going first
	if(this.gameCount % 2 === 1 && this.userToken === 'x' || 
		this.gameCount % 2 === 0 && this.userToken === 'o' ){
		setTimeout(this.doComputerTurn, 1000);
	}
	else{
		this.userCanPlay = true;
		document.getElementById('board').className = 'player-is-' + this.userToken;
	}
}
//changes orientation of an internal clone of the game board
//this is used for computer to make good move choices on hard difficulty
//flips board on different lines of symmetry (direction arg)
Game.prototype.flipBoard = function(direction){
	var board = this.relativeBoard
	var swapIndexes = function(ax, ay, bx, by){
		var tmp = board[ax][ay];
		board[ax][ay] = board[bx][by];
		board[bx][by] = tmp;
	}
	switch(direction){
		case 'horizontal':
			swapIndexes(0, 0, 0, 2);
			swapIndexes(1, 0, 1, 2);
			swapIndexes(2, 0, 2, 2);
			break;
		case 'vertical':
			swapIndexes(0, 0, 2, 0);
			swapIndexes(0, 1, 2, 1);
			swapIndexes(0, 2, 2, 2);
			break;
		case 'positiveDiagonal':
			swapIndexes(0, 1, 1, 2);
			swapIndexes(0, 0, 2, 2);
			swapIndexes(1, 0, 2, 1);
			break;
		case 'negativeDiagonal':
			swapIndexes(0, 1, 1, 0);
			swapIndexes(0, 2, 2, 0);
			swapIndexes(1, 2, 2, 1);
			break;
	}
}

//initiate 
var game = new Game();

//event listeners for player select (first screen on load)
//X
document.getElementById('choose-x').onclick = function(){
	game.setUserToken('x');
	hideChoices();
}
document.getElementById('choose-x').onkeydown = function(e){
	//space and enter/return
	if(e.keyCode === 32 || e.keyCode === 13){
		game.setUserToken('x');
		hideChoices();
	}
}
document.getElementById('choose-x').addEventListener('touchstart',
	function(e){
		e.preventDefault();
		game.setUserToken('x');
		hideChoices('x');
	});
//O
document.getElementById('choose-o').onclick = function(){
	game.setUserToken('o');
	hideChoices();
}
document.getElementById('choose-o').onkeydown = function(e){
	//space and enter/return
	if(e.keyCode === 32 || e.keyCode === 13){
		game.setUserToken('o');
		hideChoices();
	}
}
document.getElementById('choose-o').addEventListener('touchstart',
	function(e){
		e.preventDefault();
		game.setUserToken('o');
		hideChoices('o');
	});

//event listener for difficulty checkbox
document.getElementById('hard-mode').onchange = function(e){
	game.setDifficulty(this.checked ? 2 : 1);
}

//event listener for play again button, no keydown or touchstart
//since this is an actual button and delayed response on touch is ok
document.getElementById('play-again').onclick = function(){
	game.startNewGame();
}

//allows or disallows user to focus on given html DOM object
function canFocus(object, focus){
	object.setAttribute('tabindex', focus ? '0' : '-1');
}

//allows or disallows user to focus squares on game board
function canFocusBoard(focus){
	for( var i = 0; i < 9; i++){
		canFocus(document.getElementById('square-' + i), focus);
	}
}

//hides the "choose your character" screen
function hideChoices(){
	document.getElementById('choose-token').className = 'hidden';
	setTimeout(function(){
		document.getElementById('choose-token').setAttribute('style', 'display: none');
	}, 500);

	//disallow focus on character select (X or O) options and allow focus on game board
	canFocus(document.getElementById('choose-x'), false);
	canFocus(document.getElementById('choose-o'), false);
	canFocusBoard(true);
}
