var currentTurn = "white";
var currentSelectedPiece = false;
var graveyard = { "white": [], "black": [] };

const initialPieceCoordinateMappings = {
    pawn: {
        white: [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2]],
        black: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7]]
    },
    rook: {
        white: [[1, 1], [8, 1]],
        black: [[1, 8], [8, 8]]
    },
    knight: {
        white: [[2, 1], [7, 1]],
        black: [[2, 8], [7, 8]]
    },
    bishop: {
        white: [[3, 1], [6, 1]],
        black: [[3, 8], [6, 8]]
    },
    queen: {
        white: [[4, 1]],
        black: [[4, 8]]
    },
    king: {
        white: [[5, 1]],
        black: [[5, 8]]
    }
};

const pieceMoveOptions = {
    'rook': {
        repeat: true,
        moveset: [[0, 1], [-1, 0], [0, -1], [1, 0]]
    },
    'knight': {
        repeat: false,
        moveset: [[-1, 2], [1, 2], [2, 1], [-2, -1], [-1, -2], [1, -2], [-2, 1], [2, -1]]
    },
    'bishop': {
        repeat: true,
        moveset: [[-1, 1], [1, 1], [-1, -1], [1, -1]]
    },
    'queen': {
        repeat: true,
        moveset: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]]
    },
    'king': { // treated exceptionally.
        repeat: false,
        moveset: {
            beforeMove: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [-3, 0]],
            afterMove: [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]]
        }
    },
    'pawn-white': { // treated exceptionally.
        repeat: false,
        moveset: {
            beforeMove: [[0, 1], [0, 2]],
            afterMove: [[0, 1]],
            attackVector: [[-1, 1], [1, 1]]
        }
    },
    'pawn-black': { // treated exceptionally.
        repeat: false,
        moveset: {
            beforeMove: [[0, -1], [0, -2]],
            afterMove: [[0, -1]],
            attackVector: [[-1, -1], [1, -1]]
        }
    }
}

function generateBoardPlayground() {
    // This function adds a 8x8 chess board consisting of 8 rows each containing 8 boxes.
    let board = document.getElementById("board");
    board.classList.add("whites-turn");
    currentTurn = "white";
    let playground = document.createElement("div");
    playground.classList.add("board-playground");
    let currentCoord = [1, 8];
    for (let i = 1; i < 9; i++) {
        let row = document.createElement("div");
        row.id = "row" + i;
        row.classList.add("row");
        for (let e = 1; e < 9; e++) {
            let box = document.createElement("div");
            box.id = coordToNotation(currentCoord);
            box.classList.add("box");
            row.appendChild(box);
            currentCoord[0] = parseInt(currentCoord[0]) + 1;
        }
        playground.appendChild(row);
        currentCoord[0] = 1;
        currentCoord[1] = parseInt(currentCoord[1]) - 1;
    }
    for (const [pieceType, playerSpawns] of Object.entries(initialPieceCoordinateMappings)) {
        for (const [pieceColor, spawns] of Object.entries(playerSpawns)) {
            for (let e = 0; e < spawns.length; e++) {
                let spawnPosition = coordToNotation(spawns[e]);
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
    board.appendChild(playground);
}

function pieceClicked(event) {
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

function showPiecePaths(piece) {
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
    hintPath(piecePosCoords, pieceMoveset, pieceMovesetRepeat, pawnMode, pawnAttackVector);
}
function hintPath(origin, coordMap, repeat=false, pawnMode=false) {
    for (let i = 0; i < coordMap.length; i++) {
        if (!drawBoxHint(origin, coordMap[i], pawnMode))
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
}
function drawBoxHint(origin, coordMap, pawnMode=false, pawnAttackVector=false) {
    let boxNotationPos = coordToNotation([parseInt(origin[0]) + parseInt(coordMap[0]), parseInt(origin[1]) + parseInt(coordMap[1])]);
    let box = document.getElementById(boxNotationPos);
    if (box != null) {
        if (box.innerHTML == "") {
            box.classList.add("piece-path");
            let boxCommand = document.createElement("div");
            boxCommand.classList.add("box-clicker");
            boxCommand.onclick = () => {
                executeMove(boxCommand);
            };
            box.appendChild(boxCommand);
            return true;
        }
        else { // To-Do: Refactor the following code once this clause runs as expected:
            let pieceInBox = box.getElementsByClassName("piece")[0];
            if (currentTurn == "white" && !pawnMode) {
                if (typeof pieceInBox !== 'undefined') {
                    let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
                    if (pieceInBoxColor == "black") {
                        box.classList.add("piece-path-attack");
                        let boxCommand = document.createElement("div");
                        boxCommand.classList.add("box-clicker");
                        boxCommand.onclick = () => { executeMove(boxCommand); };
                        box.appendChild(boxCommand);
                    }
                }
            }
            else if (currentTurn == "black" && !pawnMode) {
                if (typeof pieceInBox !== 'undefined') {
                    let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
                    if (pieceInBoxColor == "white") {
                        box.classList.add("piece-path-attack");
                        let boxCommand = document.createElement("div");
                        boxCommand.classList.add("box-clicker");
                        boxCommand.onclick = () => { executeMove(boxCommand); };
                        box.appendChild(boxCommand);
                    }
                }
            }
            else if (pawnMode) { // To-Do: If pawnmode is true, then we must additionally check pawnAttackVector
                if (currentTurn == "black") {
                    if (typeof pieceInBox !== 'undefined') {
                        let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
                        if (pieceInBoxColor == "white") {
                            box.classList.add("piece-path-attack");
                            let boxCommand = document.createElement("div");
                            boxCommand.classList.add("box-clicker");
                            boxCommand.onclick = () => { executeMove(boxCommand); };
                            box.appendChild(boxCommand);
                        }
                    }
                }
                else if (currentTurn == "white") {
                    if (typeof pieceInBox !== 'undefined') {
                        let pieceInBoxColor = pieceInBox.getAttribute("pcolor");
                        if (pieceInBoxColor == "black") {
                            box.classList.add("piece-path-attack");
                            let boxCommand = document.createElement("div");
                            boxCommand.classList.add("box-clicker");
                            boxCommand.onclick = () => { executeMove(boxCommand); };
                            box.appendChild(boxCommand);
                        }
                    }
                }
            }
        }
    }
    return false;
}
function executeMove(destination) {
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
function clearPaths() {
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
function notationToCoord(notation) {
    let first = notation[0].charCodeAt(0) - 96; // Convert letter to number
    let second = parseInt(notation[1]);
    return [first, second];
}
  
function coordToNotation(coord) {
    let first = String.fromCharCode(coord[0] + 96); // Convert number to letter
    let second = coord[1];
    return first + second;
}
function nextTurn() {
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
function eraseGame() {
    let board = document.getElementById("board");
    board.innerHTML = "";
    if (board.classList.contains("blacks-turn")) {
        board.classList.remove("blacks-turn");
    }
    else if (board.classList.contains("whites-turn")) {
        board.classList.remove("whites-turn");
    }
}

window.addEventListener('load', function () {
    generateBoardPlayground();
});