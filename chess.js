class Game {
	constructor(targetElement, options=false) {
		this.players.white = new Player("white");
		this.players.black = new Player("black");
		this.board = new Board(targetElement, this.players);
		this.state = {
			turn: 1,
			history: []
		}
		this.currentTurn = "white";
		if (options) {
			if (options.history !== 'undefined') {
				this.state.history = options.history;
			}
			if (options.turn !== 'undefined') {
				this.state.turn = options.turn;
			}
		}
	}

	playMove(piece, newPosition) {
		if (this.board.movePiece(piece)) {
			this.state.turn++;
			this.state.history.push([piece.position, newPosition])
			this.currentTurn = this.currentTurn == "white" ? "black" : "white";
		}
		else throw new Error(`${piece.type} can't move to ${newPosition[0]},${newPosition[1]}`);
	}
}
class Player {
	constructor(color) {
		this.color = color;
		this.graveyard = [];
		this.pieces = [];
		this.pieces.push(..._spawnPieces('pawn', [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2]]));
		this.pieces.push(..._spawnPieces('rook', [[1, 1], [8, 1]]));
		this.pieces.push(..._spawnPieces('knight', [[2, 1], [7, 1]]));
		this.pieces.push(..._spawnPieces('bishop', [[3, 1], [6, 1]]));
		this.pieces.push(new Queen([4, 1]));
		this.pieces.push(new King([5, 1]));
	}
	_spawnPieces(type, positions) {
		const pieceClasses = {
			pawn: Pawn,
			rook: Rook,
			knight: Knight,
			bishop: Bishop,
			queen: Queen,
			king: King
		};

		let pieces = [];
		const PieceClass = pieceClasses[type.toLowerCase()];

		if (PieceClass) {
			for (let i = 0; i < positions.length; i++) {
				pieces.push(new PieceClass(positions[i]));
			}
		}
		else {
			console.error(`Invalid piece type: ${type}`);
		}
		return pieces;
	}
}
class Board {
	constructor(canvasId, players) {
		// To-Do: Spawn pieces from players.
		this.boardCanvas = document.querySelector(canvasId);
		this.boardCanvas.classList.add("whites-turn");
		let playground = document.createElement("div");
		playground.classList.add("board-playground");
		let currentCoord = [1, 8];
		for (let i = 1; i < 9; i++) {
			let row = document.createElement("div");
			row.id = "row" + i;
			row.classList.add("row");
			for (let e = 1; e < 9; e++) {
				let box = document.createElement("div");
				box.id = this.coordToNotation(currentCoord);
				box.classList.add("box");
				row.appendChild(box);
				currentCoord[0] = parseInt(currentCoord[0]) + 1;
			}
			playground.appendChild(row);
			currentCoord[0] = 1;
			currentCoord[1] = parseInt(currentCoord[1]) - 1;
		}
		this.selectedPiece = null;
		
		for (const [pieceType, playerSpawns] of Object.entries(this.initialPieceCoordinateMappings)) {
			for (const [pieceColor, spawns] of Object.entries(playerSpawns)) {
				for (let e = 0; e < spawns.length; e++) {
					let spawnPosition = this.coordToNotation(spawns[e]);
					let boardCell = playground.querySelector(`#${spawnPosition}`);
					let newPiece = document.createElement("div");
					newPiece.classList.add("piece");
					newPiece.setAttribute("ptype", pieceType);
					newPiece.setAttribute("pcolor", pieceColor);
					newPiece.setAttribute("hasmoved", false);
					newPiece.onclick = pieceClicked;
					boardCell.appendChild(newPiece);
				}
			}
		}
		this.boardCanvas.appendChild(playground);
	}
	pieceClicked() {
		let pieceColor = event.currentTarget.getAttribute("pcolor");
		if (currentTurn == pieceColor) {
			if (currentSelectedPiece == false) {
				currentSelectedPiece = event.currentTarget;
				currentSelectedPiece.classList.add("selected-piece");
				showPiecePaths(currentSelectedPiece);
			}
			else {
				clearPaths();
				currentSelectedPiece.classList.remove("selected-piece");
				if (currentSelectedPiece == event.currentTarget) {
					currentSelectedPiece = false;
				}
				else {
					currentSelectedPiece = event.currentTarget;
					currentSelectedPiece.classList.add("selected-piece");
					showPiecePaths(currentSelectedPiece);
				}
			}
		}
	}
	drawBoxHint(origin, coordMap, pawnMode=false) {
		let boxNotationPos = coordToNotation([parseInt(origin[0]) + parseInt(coordMap[0]), parseInt(origin[1]) + parseInt(coordMap[1])]);
		let box = document.getElementById(boxNotationPos);
		if (box != null) {
			let pieceInBox = box.querySelector(".piece");
			if (pieceInBox == null && !pawnMode) { // If a piece is present in the box and the current hinting is not for a pawn.
				box.classList.add("piece-path");
				let boxCommand = document.createElement("div");
				boxCommand.classList.add("box-clicker");
				boxCommand.onclick = () => { executeMove(boxCommand); };
				box.appendChild(boxCommand);
				return true;
			}
			else if (pieceInBox !== null) { // Needs double checking pieceInBox because the previous if
				let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
				if (pieceInBoxColor != currentTurn) {
					box.classList.add("piece-path-attack");
					let boxCommand = document.createElement("div");
					boxCommand.classList.add("box-clicker");
					boxCommand.onclick = () => { executeMove(boxCommand); };
					box.appendChild(boxCommand);
				}
			}
		}
		return false;
	}
	showPiecePaths(piece) {
		let piecePosNotation = piece.parentNode.getAttribute("id");
		let piecePosCoords = notationToCoord(piecePosNotation);
		let pieceType = piece.getAttribute("ptype");
		let pieceColor = piece.getAttribute("pcolor");
		let pieceHasMoved = piece.getAttribute("hasmoved") == "false" ? false : true;
		let pieceMoveset = null;
		let pieceMovesetRepeat = false;
		
		// To-Do: Implement a better way to handle exceptions for pawns and kings
		let pawnMode = false;
		let pawnAttackVector = false;
		
		if (pieceType == "pawn") {
			pawnMode = true;
			pawnAttackVector = pieceMoveOptions["pawn-" + pieceColor].moveset.attackVector;
			if (pieceHasMoved) {
				pieceMoveset = pieceMoveOptions["pawn-" + pieceColor].moveset.afterMove;
			}
			else {
				pieceMoveset = pieceMoveOptions["pawn-" + pieceColor].moveset.beforeMove;
			}
		}
		else if (pieceType == "king") {
			if (pieceHasMoved) {
				pieceMoveset = pieceMoveOptions.king.moveset.afterMove;
			}
			else {
				pieceMoveset = pieceMoveOptions.king.moveset.beforeMove;
			}
		}
		else {
			pieceMoveset = pieceMoveOptions[pieceType].moveset;
			pieceMovesetRepeat = pieceMoveOptions[pieceType].repeat;
		}
		// Function call is passing pawnMode and pawnAttackVector properties.
		// This is a workaround and a better solution must be found; this as well needs a way to handle king moveset hinting.
		hintPath(piecePosCoords, pieceMoveset, pieceMovesetRepeat, pawnAttackVector);
	}
	hintPath(origin, coordMap, repeat=false, pawnAttackVector=false) {
		for (let i = 0; i < coordMap.length; i++) {
			if (!drawBoxHint(origin, coordMap[i]))
				continue;
			if (repeat) {
				let hinting = true;
				let boardHint = origin;
				while (hinting) {
					boardHint = [parseInt(boardHint[0]) + parseInt(coordMap[i][0]), parseInt(boardHint[1]) + parseInt(coordMap[i][1])];
					if (!drawBoxHint(boardHint, coordMap[i])) {
						hinting = false;
					}
				}
			}
		}
		if (pawnAttackVector) {
			for (let i = 0; i < pawnAttackVector.length; i++) {
				if (!drawBoxHint(origin, pawnAttackVector[i], true))
					continue;
				if (repeat) {
					let hinting = true;
					let boardHint = origin;
					while (hinting) {
						boardHint = [parseInt(boardHint[0]) + parseInt(pawnAttackVector[i][0]), parseInt(boardHint[1]) + parseInt(pawnAttackVector[i][1])];
						if (!drawBoxHint(boardHint, pawnAttackVector[i], true)) {
							hinting = false;
						}
					}
				}
			}
		}
	}
	clearPaths() {
		let board = document.getElementById("board");
		let allBoxes = board.getElementsByClassName("box");
		for (let i = 0; i < allBoxes.length; i++) {
			if (allBoxes[i].classList.contains("piece-path")) {
				allBoxes[i].classList.remove("piece-path")
			}
			if (allBoxes[i].classList.contains("piece-path-attack")) {
				allBoxes[i].classList.remove("piece-path-attack")
			}
			let boxClicker = allBoxes[i].getElementsByClassName("box-clicker")[0];
			if (typeof boxClicker !== 'undefined') {
				boxClicker.remove();
			}
		}
	}
	executeMove(destination) {
		let destinationBox = destination.parentNode;
		clearPaths();
		currentSelectedPiece.classList.remove("selected-piece");
		if (destinationBox.querySelector(".piece") != null) {
			// Attack piece action
			let deadPiece = destinationBox.querySelector(".piece");
			let deadPieceType = deadPiece.getAttribute("ptype");
			let deadPieceColor = deadPiece.getAttribute("pcolor");
			
			if (deadPieceColor == "black") {
				graveyard['black'].push(deadPieceType);
			}
			else if (deadPieceColor == "white") {
				graveyard['white'].push(deadPieceType);
			}
			destinationBox.innerHTML = "";
		}
		
		let hasmoved = currentSelectedPiece.getAttribute("hasmoved") == "false" ? false : true;
		if (!hasmoved) {
			currentSelectedPiece.setAttribute("hasmoved", true);
		}
		destinationBox.appendChild(currentSelectedPiece);
		
		// To-Do: Check if currentSelectedPiece is checking the opponent's king
		
		nextTurn();
	}
	nextTurn() {
		if (currentSelectedPiece != false) {
			currentSelectedPiece.classList.remove("selected-piece");
			currentSelectedPiece = false;
		}
		clearPaths();
		
		wrpsp.loadStart();
		setTimeout(function () {
			wrpsp.loadDone();
		}, 1000);
		let turnBanner = document.getElementById("game-turn-banner");
		if (currentTurn == "white") {
			currentTurn = "black";
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Blacks Turn!";
		}
		else if (currentTurn == "black") {
			currentTurn = "white";
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Whites Turn!";
		}
		turnBanner.classList.remove("game-turn-banner");
		setTimeout(function () {
			turnBanner.classList.add("game-turn-banner");
		}, 1);
		setTimeout(function () {
			let board = document.getElementById("board");
			if (board.classList.contains("whites-turn")) {
				board.classList.remove("whites-turn");
				board.classList.add("blacks-turn");
			}
			else if (board.classList.contains("blacks-turn")) {
				board.classList.remove("blacks-turn");
				board.classList.add("whites-turn");
			}
		}, 1300);
		
	}
	notationToCoord(notation, inverted = false) {
		let first = notation[0].charCodeAt(0) - 96; // Convert letter to number
		let second = parseInt(notation[1]);
		if (inverted) {
			first = 9 - first;
			second = 9 - second;
		}
		return [first, second];
	}
	coordToNotation(coord, inverted = false) {
		let first = String.fromCharCode(coord[0] + 96); // Convert number to letter
		let second = coord[1];
		if (inverted) {
			first = String.fromCharCode(105 - coord[0]); // 105 corresponds to 'i'
			second = 9 - second;
		}
		return first + second;
	}
	eraseGame() {
		let board = document.getElementById("board");
		board.innerHTML = "";
		if (board.classList.contains("blacks-turn")) {
			board.classList.remove("blacks-turn");
		}
		else if (board.classList.contains("whites-turn")) {
			board.classList.remove("whites-turn");
		}
	}
}
class Piece {
	constructor(color, position) {
		this.color = color;
		this.position = position;
		this.captureVector = null;
		this.hasMoved = false;
	}
	
	move(newPosition) {
		if (!this.hasMoved) {
			this.hasMoved = true;
		}
	}

	capture() {
		
	}
}
class Pawn extends Piece {
	constructor(position) {
		super(position);
		this.type = "pawn";
		this.moveset = [[0, 1]];
		this.captureVector = [[-1, 1], [1, 1]];
		this.moveset.repeatModifier = false;
	}
	
	move(newPosition) {
		super.move(newPosition);
		this.moveset = [[0, 1]];
	}
}
class Rook extends Piece {
	constructor(position) {
		super(position);
		this.type = "rook";
		this.moveset = [[0, 1], [-1, 0], [0, -1], [1, 0]];
		this.moveset.iterateModifier = true;
		this.captureVector = null;
	}
}
class Knight extends Piece {
	constructor(position) {
		super(position);
		this.type = "knight";
		this.moveset = [[-1, 2], [1, 2], [2, 1], [-2, -1], [-1, -2], [1, -2], [-2, 1], [2, -1]];
		this.moveset.iterateModifier = false;
		this.captureVector = null;
	}
}
class Bishop extends Piece {
	constructor(position) {
		super(position);
		this.type = "bishop";
		this.moveset = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
		this.moveset.iterateModifier = true;
		this.captureVector = null;
	}
}
class Queen extends Piece {
	constructor(position) {
		super(position);
		this.type = "queen";
		this.moveset = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
		this.moveset.iterateModifier = true;
	}
}
class King extends Piece {
	constructor(position) {
		super(position);
		this.type = "king";
		this.moveset = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
		this.moveset.iterateModifier = true;
		this.captureVector = null;
	}
	
	move(newPosition) {
		super.move(newPosition);
		this.moveset = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
	}
}

window.addEventListener('load', function () {
	var currentGame = new Game("#board");
});