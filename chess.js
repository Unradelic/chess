class Game {
	constructor(targetElementId, options=false) {
		this.players = [
			new Player("white"),
			new Player("black")
		];
		this.state = {
			turnIndex: 1,
			history: []
		}
		this.currentTurn = "white";
		if (options) {
			if (options.history !== 'undefined') {
				this.state.history = options.history;
			}
			if (options.turn !== 'undefined') {
				this.state.turnIndex = options.turn - 1 < 0 ? 0 : options.turn;
			}
		}
		
		this.board = document.querySelector(targetElementId);
		if (board !== null) {
			
			// Generate board playground element containing 8x8 boxes
			this.board.classList.add("whites-turn");
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
			
			// Spawn player pieces into the board playground.
			for (let i = 0; i < this.players.length; i++) {
				let player = this.players[i];
				for (let e = 0; e < player.pieces.length; e++) {
					let piece = player.pieces[e];
					let pieceSpawnPosition = this.coordToNotation(piece.position, player.color == "black" ? true : false);
					let boardCell = playground.querySelector(`#${pieceSpawnPosition}`);
					piece.element = document.createElement("div");
					piece.element.classList.add("piece");
					piece.element.setAttribute("ptype", piece.type);
					piece.element.setAttribute("pcolor", player.color);
					piece.element.onclick = () => this.pieceClicked(player, piece);
					boardCell.appendChild(piece.element);
				}
			}
			this.board.appendChild(playground);
			
		}
		else {
			throw new Error(`Couldn't find the element by id ${targetElementId}`)
		}
	}
	pieceClicked(pieceOwner, piece) {
		if (this.currentTurn == pieceOwner.color) {
			this.clearPaths();
			if (pieceOwner.selectPiece(piece)) {
				// The piece was selected.
				this.drawPiecePath(pieceOwner, piece);
			}
			else {
				// The piece was deselected
			}
		}
	}
	drawPiecePath(player, piece) {
		let invertedModifier = player.color == "black" ? true : false;
		
		let drawMode = piece.type != "pawn" ? false : "move";
		// drawMode will define the processing behaviour of moveset.vectors
		//	Set to false for both move and attack.
		//	Set to 'move' for only moving (no attacking)
		//	Set to 'attack' for only attacking (no moving)
		// 	Set to 'attack-capture' to check for attack and capture en passant (defaulting for pawns)
		
		for (let i = 0; i < piece.moveset.vectors.length; i++) {
			if (!this.drawPathBox(player, piece.position, piece.moveset.vectors[i], drawMode, invertedModifier))
				continue;
			if (piece.moveset.iterateModifier) {
				let hinting = true;
				let boardHint = piece.position; // This is the pointer that is gonna move following piece moveset vectors.
				while (hinting) {
					boardHint = [
						parseInt(boardHint[0]) + parseInt(piece.moveset.vectors[i][0]),
						parseInt(boardHint[1]) + parseInt(piece.moveset.vectors[i][1])
					];
					if (!this.drawPathBox(player, boardHint, piece.moveset.vectors[i], drawMode, invertedModifier)) {
						hinting = false;
					}
				}
			}
		}
		// Process moveset.captureVectors, if any.
		drawMode = piece.type != "pawn" ? "attack" : "attack-capture";
		for (let i = 0; i < piece.moveset.captureVectors.length; i++) {
			if (!this.drawPathBox(player, piece.position, piece.moveset.captureVectors[i], drawMode, invertedModifier))
				continue;
		}
	}
	drawPathBox(player, position, vector, drawMode, invertedModifier) {
		// rawTPos is an abbreviation for rawTranslatedPosition
		let rawTPos = [parseInt(position[0]) + parseInt(vector[0]), parseInt(position[1]) + parseInt(vector[1])];
		let inBoardBounds = (rawTPos[0] > 0 && rawTPos[0] < 9) && (rawTPos[1] > 0 && rawTPos[1] < 9) ? true : false;
		if (!inBoardBounds) {
			return false;
		}
		// returnValue must be true if current vector position is not obstructed (wall bounds or a piece)
		// in order to hint iterateModifier to continue, if active.
		let returnValue = false;
		let translatedPosition = this.coordToNotation(rawTPos, invertedModifier);
		let box = document.querySelector(`#${translatedPosition}`);
		if (box != null) {
			let pieceInBox = box.querySelector(".piece");
			if (drawMode) {
				if (drawMode == "move") {
					if (pieceInBox === null) {
						box.classList.add("piece-path");
						let boxCommand = document.createElement("div");
						boxCommand.classList.add("box-clicker");
						boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier); };
						box.appendChild(boxCommand);
						return true;
					}
				}
				else if (drawMode == "attack" && pieceInBox !== null) {
					let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
					if (pieceInBoxColor != player.color) {
						box.classList.add("piece-path-attack");
						let boxCommand = document.createElement("div");
						boxCommand.classList.add("box-clicker");
						boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier); };
						box.appendChild(boxCommand);
					}
				}
				else if (drawMode == "attack-capture") {
					if (pieceInBox !== null) {
						// Attack
						let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
						if (pieceInBoxColor != player.color) {
							box.classList.add("piece-path-attack");
							let boxCommand = document.createElement("div");
							boxCommand.classList.add("box-clicker");
							boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier); };
							box.appendChild(boxCommand);
						}
					}
					else {
						// Capture?
						let translatedHintPosition = this.coordToNotation([rawTPos[0], rawTPos[1] - 1], invertedModifier);
						let hintBox = document.querySelector(`#${translatedHintPosition}`);
						if (hintBox != null) {
							let pieceInHintBox = hintBox.querySelector(".piece");
							if (pieceInHintBox !== null) {
								let pieceInHintBoxColor = pieceInHintBox.getAttribute("pcolor");
								if (pieceInHintBoxColor != player.color && pieceInHintBox.getAttribute("ptype") == "pawn") {
									// A pawn to capture has been detected.
									box.classList.add("piece-path-attack");
									let boxCommand = document.createElement("div");
									boxCommand.classList.add("box-clicker");
									boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier, true); };
									box.appendChild(boxCommand);
								}
							}
						}
					}
				}
			}
			else {
				// drawMode = NORMAL
				if (pieceInBox !== null) {
					let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
					if (pieceInBoxColor != player.color) {
						box.classList.add("piece-path-attack");
						let boxCommand = document.createElement("div");
						boxCommand.classList.add("box-clicker");
						boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier); };
						box.appendChild(boxCommand);
					}
				}
				else {
					box.classList.add("piece-path");
					let boxCommand = document.createElement("div");
					boxCommand.classList.add("box-clicker");
					boxCommand.onclick = () => { this.playMove(player, rawTPos, invertedModifier); };
					box.appendChild(boxCommand);
					return true;
				}
			}
		}
		return returnValue;
	}
	clearPaths() {
		let boxHints = this.board.querySelectorAll(".piece-path,.piece-path-attack");
		for (let i = 0; i < boxHints.length; i++) {
			boxHints[i].classList.remove("piece-path")
			boxHints[i].classList.remove("piece-path-attack")
			
		}
		let boxClickers = this.board.querySelectorAll(".box-clicker");
		for (let i = 0; i < boxClickers.length; i++) {
			boxClickers[i].remove();
		}
	}
	playMove(player, position, invertedModifier, capturing = false) {
		let notationPosition = this.coordToNotation(position, invertedModifier);
		let destinationBox = this.board.querySelector(`#${notationPosition}`);
		this.clearPaths();
		let selectedPiece = player.selectedPiece();
		selectedPiece.element.classList.remove("selected-piece");
		selectedPiece.move(position);
		player.selectPiece(null);
		if (capturing) {
			let capturingCoord = [position[0], position[1] - 1];
			let notationCapturing = this.coordToNotation(capturingCoord, invertedModifier);
			let captureBox = this.board.querySelector(`#${notationCapturing}`);
			if (captureBox.querySelector(".piece") != null) {
				// Capture piece
				let deadPiece = captureBox.querySelector(".piece");
				let deadPieceType = deadPiece.getAttribute("ptype");
				player.capturedPieces.push(deadPieceType);
				deadPiece.remove();
			}
		}
		else if (destinationBox.querySelector(".piece") != null) {
			// Attack piece
			let deadPiece = destinationBox.querySelector(".piece");
			let deadPieceType = deadPiece.getAttribute("ptype");
			player.capturedPieces.push(deadPieceType);
			deadPiece.remove();
		}
		
		destinationBox.appendChild(selectedPiece.element);
		
		this.state.history.push([selectedPiece.position, position])
		
		this.clearPaths();
		
		wrpsp.loadStart();
		setTimeout(function () { wrpsp.loadDone(); }, 1000);
		
		
		let turnBanner = document.querySelector("#game-turn-banner");
		if (player.color == "white") {
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Blacks Turn!";
		}
		else if (player.color == "black") {
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Whites Turn!";
		}
		
		turnBanner.classList.remove("game-turn-banner");
		setTimeout(function () {
			turnBanner.classList.add("game-turn-banner");
		}, 1);
		setTimeout(function () {
			if (this.board.classList.contains("whites-turn")) {
				this.board.classList.remove("whites-turn");
				this.board.classList.add("blacks-turn");
			}
			else if (this.board.classList.contains("blacks-turn")) {
				this.board.classList.remove("blacks-turn");
				this.board.classList.add("whites-turn");
			}
		}, 1300);
		
		this.currentTurn = this.currentTurn == "white" ? "black" : "white";
		this.state.turnIndex++;
	}
	invertCoord(coord) {
		return [
			9 - coord[0],
			9 - coord[1]
		];
	}
	notationToCoord(notation, inverted = false) {
		let newCoord = [
			notation[0].charCodeAt(0) - 96,
			parseInt(notation[1])
		];
		if (inverted) {
			newCoord = this.invertCoord(newCoord);
		}
		return newCoord;
	}
	coordToNotation(coord, inverted = false) {
		let newCoord = coord;
		if (inverted) {
			newCoord = this.invertCoord(newCoord);
		}
		let newNotation = [
			String.fromCharCode(newCoord[0] + 96),
			newCoord[1]
		];
		return newNotation.join("");
	}
	eraseGame() {
		this.board.innerHTML = "";
		if (this.board.classList.contains("blacks-turn")) {
			this.board.classList.remove("blacks-turn");
		}
		else if (this.board.classList.contains("whites-turn")) {
			this.board.classList.remove("whites-turn");
		}
	}
}
class Player {
	constructor(color) {
		this.color = color;
		this.pieces = [];
		this.pieces.push(...this.invokePiece(Pawn, [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2]]));
		this.pieces.push(...this.invokePiece(Rook, [[1, 1], [8, 1]]));
		this.pieces.push(...this.invokePiece(Knight, [[2, 1], [7, 1]]));
		this.pieces.push(...this.invokePiece(Bishop, [[3, 1], [6, 1]]));
		// Exception for queen and king starting positions, because the queen must spawn in a box of its same color.
		// A possible implementation for this is flip coordinates horizontally or vertically
		// For this case, it needs a horizontal flip.
		if (this.color == "black") {
			this.pieces.push(new Queen([5, 1]));
			this.pieces.push(new King([4, 1]));
		}
		else {
			this.pieces.push(new Queen([4, 1]));
			this.pieces.push(new King([5, 1]));
		}
		this.selectedPieceIndex = null;
		this.selectedPiece = () => { return this.pieces[this.selectedPieceIndex]; };
		this.capturedPieces = [];
	}
	selectPiece(piece) {
		if (piece !== null) {
			let pieceIndex = this.pieces.indexOf(piece);
			if (pieceIndex == this.selectedPieceIndex) {
				this.selectedPieceIndex = null;
				return false;
			}
			else {
				this.selectedPieceIndex = pieceIndex;
				return true;
			}
		}
		else {
			this.selectedPieceIndex = null;
			return false
		}
	}
	invokePiece(PieceClassName, positions) {
		let pieces = [];
		for (let i = 0; i < positions.length; i++) {
			pieces.push(new PieceClassName(positions[i]));
		}
		return pieces;
	}
}
class Piece {
	constructor(position) {
		this.position = position;
		this.moveset = {
			vectors: [],
			captureVectors: [],
			iterateModifier: false
		}
		this.hasMoved = false;
		this.captured = false;
		this.element = null;
	}
	move(position) {
		if (!this.hasMoved) {
			this.hasMoved = true;
		}
		this.position = position;
	}
	capture() {
		
	}
}
class Pawn extends Piece {
	constructor(position) {
		super(position);
		this.type = "pawn";
		this.moveset.vectors = [[0, 1], [0, 2]];
		this.moveset.captureVectors = [[-1, 1], [1, 1]];
	}
	move(position) {
		super.move(position);
		this.moveset.vectors = [[0, 1]];
	}
}
class Rook extends Piece {
	constructor(position) {
		super(position);
		this.type = "rook";
		this.moveset.vectors = [[0, 1], [-1, 0], [0, -1], [1, 0]];
		this.moveset.iterateModifier = true;
	}
}
class Knight extends Piece {
	constructor(position) {
		super(position);
		this.type = "knight";
		this.moveset.vectors = [[-1, 2], [1, 2], [2, 1], [-2, -1], [-1, -2], [1, -2], [-2, 1], [2, -1]];
	}
}
class Bishop extends Piece {
	constructor(position) {
		super(position);
		this.type = "bishop";
		this.moveset.vectors = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
		this.moveset.iterateModifier = true;
	}
}
class Queen extends Piece {
	constructor(position) {
		super(position);
		this.type = "queen";
		this.moveset.vectors = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
		this.moveset.iterateModifier = true;
	}
}
class King extends Piece {
	constructor(position) {
		super(position);
		this.type = "king";
		//To-Do: Update moveset vectors to enable switching places with the rook
		this.moveset.vectors = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
	}
	move(position) {
		if (!this.hasMoved) {
			this.moveset.vectors = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
		}
		super.move(position);
		
	}
}

var currentGame = null;
window.addEventListener('load', () => {
	currentGame = new Game("#board");
});