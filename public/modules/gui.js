import {Init as InitGame, HandleInput, pieces, turn, oob, attackMap, NextColor, state as gameState} from './game.js';
import {v2d} from './helper.js'
var pieceElements = document.querySelectorAll("piece");
var markElements = document.querySelectorAll(".mark");
const pieceArea = document.getElementById("piece-area");
const markArea = document.getElementById("mark-area");
const boardArea = document.getElementById("board");
var gid = null;
var myTurn = -1;
var myUid = null;
var online = false;
var socket;
var listenForChanges = false;
var flipBoard = false;

var from, to, movesGUI, dragged;

const colorString = ['white', 'black'];

document.addEventListener("mousemove",e => {
    if(dragged != null){
        dragged.style.setProperty("--mouse-x",(e.clientX - pieceArea.offsetLeft)+"px");
        dragged.style.setProperty("--mouse-y",(e.clientY - pieceArea.offsetTop)+"px");
    }
});

document.addEventListener("mouseup", e => {
    if(dragged != null){
        dragged.classList.remove("drag");
        dragged.style.removeProperty("--mouse-x");
        dragged.style.removeProperty("--mouse-y");
        to = new v2d(Math.floor((e.clientX-pieceArea.offsetLeft)/(pieceArea.clientWidth*0.1225)),Math.floor((e.clientY-pieceArea.offsetTop)/(pieceArea.clientWidth*0.1225)));
        if(flipBoard) to = new v2d(7 - to.x, 7 - to.y);
        if(!oob(to)){
            if(from != null && (to.x!=from.x||to.y!=from.y)){
                Move();
            }
        }
        dragged = null;
    }
});

pieceArea.addEventListener("mousedown", e => {
    if(e.target != e.currentTarget) return;
    to = new v2d(Math.floor((e.clientX-pieceArea.offsetLeft)/(pieceArea.clientWidth*0.1225)),Math.floor((e.clientY-pieceArea.offsetTop)/(pieceArea.clientWidth*0.1225)));
    if(flipBoard) to = new v2d(7 - to.x, 7 - to.y);
    if(Move())DrawBoard();
    DrawMarks();
});

gid = getParameterByName('gid');
if(gid != null){
    socket = io();
    socket.on('connect', () => {
        socket.emit('joinGame', gid);
    });
    socket.on('moveError', error => {
        console.log('ERROR!');
        console.log(error);
        location.reload();
    });
    socket.on('move', data => {
        if(data.from != myUid){
            HandleInput(new v2d(data.move.x,data.move.y), new v2d(data.move.x2,data.move.y2));
            from = null;
            to = null;
            movesGUI = [];
            DrawBoard();
            DrawMarks();
            if (gameState != null) EndGame(gameState, colorString[NextColor(myTurn)]);
        }
    });
    firebase.auth().onAuthStateChanged(user => {
        if(user == null) location.href ='/login';
        myUid = user.uid;
        database.ref('games/'+gid).once('value', snapshot => {
            if(!snapshot.exists()) location.href = '/';
            let val = snapshot.val();
            for(let i = 0; i < val.players.length; i++){
                if(val.players[i] == user.uid){
                    myTurn = i;
                    break;
                }
            }
            InitGame(val.BCBN);
            if(myTurn == 1) flipBoard = true;
            DrawBoard();
            if(val.state != 'live') EndGame(val.state, colorString[val.winner]);
        });
    });
    online = true;
}
else{
    InitGame();
    DrawBoard();
}

function Move(){
    let o;
    if(!online){
        o = HandleInput(from, to);
        from = null;
        to = null;
        movesGUI = null;
    }
    else{
        if(from == null || to == null) return false;
        o = HandleInput(from, to);
        if(o) firebase.auth().currentUser.getIdToken().then(token => {
            let move = {
                x:from.x,
                y:from.y,
                x2:to.x,
                y2:to.y
            };
            socket.emit('makeMove', {gid, token, move});
            from = null;
            to = null;
            movesGUI = null;
            DrawMarks();
        });
        if(o) DrawBoard();
        DrawMarks();
    }
    if(gameState != null){
        EndGame(gameState, colorString[NextColor(turn)]);
    }
    return o;
}

function EndGame(state, winner){
    myTurn = -1;
    let modal = M.Modal.getInstance(document.getElementById('game-end-modal'));
    document.getElementById('endgame-message-header').innerHTML = state;
    let msg = document.getElementById('endgame-message');
    if(state == 'stalemate') msg.innerHTML = 'draw';
    if(state == 'checkmate') msg.innerHTML = winner + ' won!'
    modal.open();
}

function DrawBoard(){
    pieceElements.forEach(e => {
        e.remove();
    })
    for(let i = 0; i < 64; i++){
        if(pieces[i] != null){
            var piece = document.createElement("piece");
            switch(pieces[i].color){
                case 0:
                    piece.classList.add("white-p");
                    break;
                case 1:
                    piece.classList.add("black-p");
                    break;
            }
            piece.classList.add(pieces[i].typeName);
            let gameX, gameY;
            if(flipBoard){
                gameX = 7 - pieces[i].pos.x;
                gameY = 7 - pieces[i].pos.y;
            }
            else{
                gameX = pieces[i].pos.x;
                gameY = pieces[i].pos.y;
            }
            piece.style.setProperty("--game-x",gameX);
            piece.style.setProperty("--game-y",gameY);
            pieceArea.appendChild(piece);
        }
    }
    pieceElements = document.querySelectorAll("piece");
    pieceElements.forEach(InitPieceElement);
}

function InitPieceElement(element){
    element.addEventListener("mousedown",e => {
        if(dragged == null){
            let o = false;
            if(movesGUI!=null && from != null){
                to = new v2d(Math.floor((e.clientX-pieceArea.offsetLeft)/(pieceArea.clientWidth*0.1225)),Math.floor((e.clientY-pieceArea.offsetTop)/(pieceArea.clientWidth*0.1225)));
                if(flipBoard) to = new v2d(7 - to.x, 7 - to.y);
                o = Move();
            }
            if(o==false){
                dragged = e.target;
                e.target.classList.add("drag");
                dragged.style.setProperty("--mouse-x",(e.clientX - pieceArea.offsetLeft)+"px");
                dragged.style.setProperty("--mouse-y",(e.clientY - pieceArea.offsetTop)+"px");
                from = new v2d(dragged.style.getPropertyValue("--game-x")-0,dragged.style.getPropertyValue("--game-y")-0);
                if(flipBoard) from = new v2d(7 - from.x,7-from.y);
                if(turn == pieces[from.idx()].color && (online == false || turn == myTurn)){
                    movesGUI = pieces[from.idx()].moves;
                    DrawMarks();
                }
                else{
                    from = null;
                }
            }
        }
    });
}

function DrawMarks(){
    markElements.forEach(e=>{e.remove();});
    if(from!=null){
        var mark = document.createElement("div");
        mark.classList.add("mark");
        mark.classList.add("circle");
        let gameX, gameY;
        if(flipBoard){
            gameX = 7 - from.x;
            gameY = 7 - from.y;
        }
        else{
            gameX = from.x;
            gameY = from.y;
        }
        mark.style.setProperty("--game-x",gameX);
        mark.style.setProperty("--game-y",gameY);
        markArea.appendChild(mark);
    }
    if (movesGUI != null) for(let i = 0; i < movesGUI.length; i++){
        let mark = document.createElement("div");
        mark.classList.add("mark");
        mark.classList.add("dot");
        let gameX, gameY;
        if(flipBoard){
            gameX = 7 - movesGUI[i].x;
            gameY = 7 - movesGUI[i].y;
        }
        else{
            gameX = movesGUI[i].x;
            gameY = movesGUI[i].y;
        }
        mark.style.setProperty("--game-x",gameX);
        mark.style.setProperty("--game-y",gameY);
        markArea.appendChild(mark);
    }
    markElements = document.querySelectorAll(".mark");
}

function DrawDebug(){
    let opponent = NextColor(turn);
    for(let i = 0; i < 64; i++){
        if(attackMap[opponent][i] == true){
            let p = new v2d(i);
            if(pieces[p.idx()] == null || pieces[p.idx()].color != opponent){
                let mark = document.createElement("div");
                mark.classList.add("mark");
                mark.classList.add("debug");
                let gameX, gameY;
                if(flipBoard){
                    gameX = 7 - p.x;
                    gameY = 7 - p.y;
                }
                else{
                    gameX = p.x;
                    gameY = p.y;
                }
                mark.style.setProperty("--game-x",gameX);
                mark.style.setProperty("--game-y",gameY);
                markArea.appendChild(mark);
            }
        }
    }
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}