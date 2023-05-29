var currentTurn = "whites";
var currentSelectedPiece = false;
var graveyard = { "whites": [], "blacks": [] };

const whitePawnDirections = [[0, 1], [0, 2]];
const blackPawnDirections = [[0, -1], [0, -2]];
const whiteMovedPawnDirections = [[0, 1]];
const blackMovedPawnDirections = [[0, -1]];

const whitePawnAttacks = [[-1, 1], [1, 1]];
const blackPawnAttacks = [[-1, -1], [1, -1]];

const kingDirections = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];
const knightDirections = [[-1, 2], [1, 2], [2, 1], [-2, -1], [-1, -2], [1, -2], [-2, 1], [2, -1]];
const bishopDirections = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
const rookDirections = [[0, 1], [-1, 0], [0, -1], [1, 0]];
const queenDirections = [[-1, 1], [0, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]];

function generateBoardPlayground() {
    let board = document.getElementById("board");
    board.classList.add("whites-turn");
    currentTurn = "whites";
    let playground = '<div class="board-playground">';
    let currentCoord = [1, 8];
    for (let i = 1; i < 9; i++) {
        playground += '<div id="row'+i+'" class="row">';
        for (let e = 1; e < 9; e++) {
            playground += '<div id="' + coordToNotation(currentCoord) + '" class="box">';
            playground += getPieceFromInit(currentCoord);
            playground += '</div>';
            currentCoord[0] = parseInt(currentCoord[0]) + 1;
        }
        playground += '</div>';
        currentCoord[0] = 1;
        currentCoord[1] = parseInt(currentCoord[1]) - 1;
    }
    playground += '</div>';
    board.innerHTML = playground;
}
function getPieceFromInit(coord) {
    if ((coord[0] == 1 && coord[1] == 8) || (coord[0] == 8 && coord[1] == 8)) {
        return '<div class="piece black-piece rook-black" ptype="rook" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if ((coord[0] == 2 && coord[1] == 8) || (coord[0] == 7 && coord[1] == 8)) {
        return '<div class="piece black-piece knight-black" ptype="knight" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if ((coord[0] == 3 && coord[1] == 8) || (coord[0] == 6 && coord[1] == 8)) {
        return '<div class="piece black-piece bishop-black" ptype="bishop" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[0] == 4 && coord[1] == 8) {
        return '<div class="piece black-piece queen-black" ptype="queen" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[0] == 5 && coord[1] == 8) {
        return '<div class="piece black-piece king-black" ptype="king" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if ((coord[0] == 1 && coord[1] == 1) || (coord[0] == 8 && coord[1] == 1)) {
        return '<div class="piece white-piece rook-white" ptype="rook" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if ((coord[0] == 2 && coord[1] == 1) || (coord[0] == 7 && coord[1] == 1)) {
        return '<div class="piece white-piece knight-white" ptype="knight" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if ((coord[0] == 3 && coord[1] == 1) || (coord[0] == 6 && coord[1] == 1)) {
        return '<div class="piece white-piece bishop-white" ptype="bishop" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[0] == 4 && coord[1] == 1) {
        return '<div class="piece white-piece queen-white" ptype="queen" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[0] == 5 && coord[1] == 1) {
        return '<div class="piece white-piece king-white" ptype="king" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[1] == 7) {
        return '<div class="piece black-piece pawn-black" ptype="pawn" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else if (coord[1] == 2) {
        return '<div class="piece white-piece pawn-white" ptype="pawn" hasmoved="false" onclick="pieceClicked(event)"></div>';
    }
    else return "";
}
function registerPieceClickEvents() {
    let board = document.getElementById("board");
    let allPieces = board.getElementsByClassName("piece");
    for (let i = 0; i < allPieces.length; i++) {
        allPieces[i].addEventListener("click", pieceClicked, false);
    }
}
function pieceClicked(event) {
    if ((currentTurn == "whites" && event.currentTarget.classList.contains("black-piece"))
        || (currentTurn == "blacks" && event.currentTarget.classList.contains("white-piece"))) {
        return;
    }
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
function showPiecePaths(piece) {
    let currentNotation = piece.parentNode.getAttribute("id");
    let currentCoords = notationToCoord(currentNotation);
    let pieceType = piece.getAttribute("ptype");
    if (pieceType == "pawn") {
        if (piece.classList.contains("black-piece")) {
            if (piece.getAttribute("hasmoved") == "false") {
                hintPath(currentCoords, blackPawnDirections, false, true);
            }
            else {
                hintPath(currentCoords, blackMovedPawnDirections, false, true);
            }
        }
        else if (piece.classList.contains("white-piece")) {
            if (piece.getAttribute("hasmoved") == "false") {
                hintPath(currentCoords, whitePawnDirections, false, true);
            }
            else {
                hintPath(currentCoords, whiteMovedPawnDirections, false, true);
            }
        }
    }
    else if (pieceType == "knight") {
        hintPath(currentCoords, knightDirections);
    }
    else if (pieceType == "king") {
        hintPath(currentCoords, kingDirections);
    }
    else if (pieceType == "queen") {
        hintPath(currentCoords, queenDirections, true);
    }
    else if (pieceType == "bishop") {
        hintPath(currentCoords, bishopDirections, true);
    }
    else if (pieceType == "rook") {
        hintPath(currentCoords, rookDirections, true);
    }
}
function hintPath(origin, coordMap, repeat = false, pawnMode=false) {
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
function drawBoxHint(origin, coordMap, pawnMode=false) {
    let boardHint = coordToNotation([parseInt(origin[0]) + parseInt(coordMap[0]), parseInt(origin[1]) + parseInt(coordMap[1])]);
    let box = document.getElementById(boardHint);
    if (box != null) {
        if (box.innerHTML == "") {
            box.classList.add("piece-path");
            box.insertAdjacentHTML("beforeend", '<div class="box-clicker" onclick="executeMove(this)"></div>');
            return true;
        }
        else {
            if (currentTurn == "whites" && !pawnMode) {
                if (typeof box.getElementsByClassName("black-piece")[0] !== 'undefined') {
                    box.classList.add("piece-path-attack");
                    box.insertAdjacentHTML("beforeend", '<div class="box-clicker" onclick="executeMove(this)"></div>');
                }
            }
            else if (currentTurn == "blacks" && !pawnMode) {
                if (typeof box.getElementsByClassName("white-piece")[0] !== 'undefined') {
                    box.classList.add("piece-path-attack");
                    box.insertAdjacentHTML("beforeend", '<div class="box-clicker" onclick="executeMove(this)"></div>');
                }
            }
            //if pawnmode is true, then we are checking for a pawn attack
            else if (pawnMode) {
                if (typeof box.getElementsByClassName("white-piece")[0] !== 'undefined'
                    || typeof box.getElementsByClassName("black-piece")[0] !== 'undefined') {
                    box.classList.add("piece-path-attack");
                    box.insertAdjacentHTML("beforeend", '<div class="box-clicker" onclick="executeMove(this)"></div>');
                }
            }
            return false;
        }
    }
    else {
        return false;
    }
}
function executeMove(destination) {
    let destinationBox = destination.parentNode;
    clearPaths();
    currentSelectedPiece.classList.remove("selected-piece");
    if (destinationBox.innerHTML != "") {
        // Attack piece action
        let deadPiece = destinationBox.getElementsByClassName("piece")[0];
        let deadPieceType = deadPiece.getAttribute("ptype");
        
        if (deadPiece.classList.contains("black-piece")) {
            graveyard['blacks'].push(deadPieceType);
        }
        else if (deadPiece.classList.contains("white-piece")) {
            graveyard['whites'].push(deadPieceType);
        }
        destinationBox.innerHTML = "";
    }
    if (currentSelectedPiece.getAttribute("hasmoved") == "false") {
        currentSelectedPiece.setAttribute("hasmoved", "true");
    }
    destinationBox.insertAdjacentHTML("afterbegin", currentSelectedPiece.outerHTML);
    currentSelectedPiece.remove();
    currentSelectedPiece = false;
    
    //Check if currentSelectedPiece is checking the opponent's king
    
    
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
    let first = notation[0];
    let second = notation[1];
    switch (first) {
        case 'a':
            first = 1;
        break;
        case 'b':
            first = 2;
        break;
        case 'c':
            first = 3;
        break;
        case 'd':
            first = 4;
        break;
        case 'e':
            first = 5;
        break;
        case 'f':
            first = 6;
        break;
        case 'g':
            first = 7;
        break;
        case 'h':
            first = 8;
        break;
    }
    return [parseInt(first), parseInt(second)];
}
function coordToNotation(coord) {
    let first = coord[0];
    let second = coord[1];
    switch (first) {
        case 1:
            first = 'a';
        break;
        case 2:
            first = 'b';
        break;
        case 3:
            first = 'c';
        break;
        case 4:
            first = 'd';
        break;
        case 5:
            first = 'e';
        break;
        case 6:
            first = 'f';
        break;
        case 7:
            first = 'g';
        break;
        case 8:
            first = 'h';
        break;
    }
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
    if (currentTurn == "whites") {
        currentTurn = "blacks";
        turnBanner.getElementsByClassName("game-turn-banner-text")[0].innerHTML = "Blacks Turn!";
    }
    else if (currentTurn == "blacks") {
        currentTurn = "whites";
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
    //registerPieceClickEvents();
});