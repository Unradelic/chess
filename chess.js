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
					piece.element.setAttribute("hasmoved", piece.hasMoved);
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
	pieceClicked(player, piece) {
		if (this.currentTurn == player.color) {
			if (player.selectedPiece == null) {
				player.selectedPiece = piece;
				player.selectedPiece.element.classList.add("selected-piece");
				this.drawPiecePath(player);
			}
			else {
				this.clearPaths();
				player.selectedPiece.element.classList.remove("selected-piece");
				if (player.selectedPiece == piece) {
					player.selectedPiece = null;
				}
				else {
					player.selectedPiece = piece;
					player.selectedPiece.element.classList.add("selected-piece");
					this.drawPiecePath(player);
				}
			}
		}
	}
	drawPiecePath(player) {
		let invertedModifier = player.color == "black" ? true : false;
		for (let i = 0; i < player.selectedPiece.moveset.length; i++) {
			if (!this.drawPathBox(player, player.selectedPiece.position, player.selectedPiece.moveset[i], invertedModifier))
				continue;
			if (player.selectedPiece.moveset.repeatModifier) {
				let hinting = true;
				while (hinting) {
					origin = [parseInt(origin[0]) + parseInt(player.selectedPiece.moveset[i][0]), parseInt(origin[1]) + parseInt(player.selectedPiece.moveset[i][1])];
					if (!this.drawPathBox(player, player.selectedPiece.position, player.selectedPiece.moveset[i], invertedModifier)) {
						hinting = false;
					}
				}
			}
		}
	}
	drawPathBox(player, position, vector, invertedModifier=false) {
		let translatedPosition = this.coordToNotation([parseInt(position[0]) + parseInt(vector[0]), parseInt(position[1]) + parseInt(vector[1])], invertedModifier);
		let box = document.querySelector(`#${translatedPosition}`);
		if (box != null) {
			let pieceInBox = box.querySelector(".piece");
			if (pieceInBox === null) {
				box.classList.add("piece-path");
				let boxCommand = document.createElement("div");
				boxCommand.classList.add("box-clicker");
				boxCommand.onclick = () => { this.playMove(player, translatedPosition); };
				box.appendChild(boxCommand);
				return true;
			}
			else {
				let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
				if (pieceInBoxColor != player.selectedPiece.color) {
					box.classList.add("piece-path-attack");
					let boxCommand = document.createElement("div");
					boxCommand.classList.add("box-clicker");
					boxCommand.onclick = () => { this.playMove(player, translatedPosition); };
					box.appendChild(boxCommand);
				}
			}
		}
		return false;
	}
	clearPaths() {
		let allBoxes = this.board.getElementsByClassName("box");
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
	playMove(player, position) {
		let destinationBox = this.board.querySelector(`#${position}`);
		this.clearPaths();
		player.selectedPiece.element.classList.remove("selected-piece");
		if (destinationBox.querySelector(".piece") != null) {
			// Attack piece action
			let deadPiece = destinationBox.querySelector(".piece");
			let deadPieceType = deadPiece.getAttribute("ptype");
			player.graveyard.push(deadPieceType);
			deadPiece.remove();
		}
		
		if (!player.selectedPiece.hasMoved) {
			player.selectedPiece.element.setAttribute("hasmoved", true);
		}
		destinationBox.appendChild(player.selectedPiece.element);
		
		this.state.history.push([player.selectedPiece.position, position])
		
		if (player.selectedPiece != null) {
			player.selectedPiece.element.classList.remove("selected-piece");
			player.selectedPiece = null;
		}
		this.clearPaths();
		
		wrpsp.loadStart();
		setTimeout(function () { wrpsp.loadDone(); }, 1000);
		
		let turnBanner = document.querySelector("#game-turn-banner");
		if (player.color == "white") {
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Whites Turn!";
		}
		else if (player.color == "black") {
			turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Blacks Turn!";
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
		this.graveyard = [];
		this.pieces = [];
		this.pieces.push(...this.invokePiece(Pawn, [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2]]));
		this.pieces.push(...this.invokePiece(Rook, [[1, 1], [8, 1]]));
		this.pieces.push(...this.invokePiece(Knight, [[2, 1], [7, 1]]));
		this.pieces.push(...this.invokePiece(Bishop, [[3, 1], [6, 1]]));
		if (this.color == "black") { //Exception for the queen and king since the queen must spawn in a box of its same color.
			this.pieces.push(new Queen([5, 1]));
			this.pieces.push(new King([4, 1]));
		}
		else {
			this.pieces.push(new Queen([4, 1]));
			this.pieces.push(new King([5, 1]));
		}
		this.selectedPiece = null;
	}
	invokePiece(PieceClass, positions) {
		let pieces = [];
		for (let i = 0; i < positions.length; i++) {
			pieces.push(new PieceClass(positions[i]));
		}
		return pieces;
	}
}
class Piece {
	constructor(position) {
		this.position = position;
		this.moveset = null;
		this.captureVector = null;
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
		this.moveset = [[0, 1]];
		this.captureVector = [[-1, 1], [1, 1]];
		this.moveset.repeatModifier = false;
	}
	
	move(position) {
		super.move(position);
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
	
	move(position) {
		super.move(position);
		this.moveset = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
	}
}

var currentGame = null;
window.addEventListener('load', () => {
	currentGame = new Game("#board");
});