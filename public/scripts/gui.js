var pieceElements = document.querySelectorAll("piece");
var markElements = document.querySelectorAll(".mark");
const pieceArea = document.getElementById("piece-area");
const markArea = document.getElementById("mark-area");
const boardArea = document.getElementById("board");
//document.getElementById("bruh-button").addEventListener("click",function(){document.getElementById("bruh-sound").play();});

var from, to, movesGUI, dragged;

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
        if(!oob(to)){
            if(to.x!=from.x||to.y!=from.y)InputHandler(to, from);
            to = null;
        }
        dragged = null;
    }
});

pieceArea.addEventListener("mousedown", e => {
    if(e.target != e.currentTarget) return;
    to = new v2d(Math.floor((e.clientX-pieceArea.offsetLeft)/(pieceArea.clientWidth*0.1225)),Math.floor((e.clientY-pieceArea.offsetTop)/(pieceArea.clientWidth*0.1225)));
    InputHandler();
    to = null;
});

function DrawBoard(){
    pieceElements.forEach(e => {
        e.remove();
    })
    for(let i = 0; i < 64; i++){
        if(pieces[i] != null){
            var piece = document.createElement("piece");
            switch(pieces[i].color){
                case 0:
                    piece.classList.add("white");
                    break;
                case 1:
                    piece.classList.add("black");
                    break;
            }
            piece.classList.add(pieces[i].typeName);
            piece.style.setProperty("--game-x",pieces[i].pos.x);
            piece.style.setProperty("--game-y",pieces[i].pos.y);
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
                o = InputHandler();
            }
            if(o==false){
                dragged = e.target;
                e.target.classList.add("drag");
                dragged.style.setProperty("--mouse-x",(e.clientX - pieceArea.offsetLeft)+"px");
                dragged.style.setProperty("--mouse-y",(e.clientY - pieceArea.offsetTop)+"px");
                from = new v2d(dragged.style.getPropertyValue("--game-x")-0,dragged.style.getPropertyValue("--game-y")-0);
                if(turn == pieces[from.idx()].color){
                    movesGUI = pieces[from.idx()].moves;
                    DrawMarks();
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
        mark.style.setProperty("--game-x",from.x);
        mark.style.setProperty("--game-y",from.y);
        markArea.appendChild(mark);
    }
    for(let i = 0; i < movesGUI.length; i++){
        let mark = document.createElement("div");
        mark.classList.add("mark");
        mark.classList.add("dot");
        mark.style.setProperty("--game-x",movesGUI[i].x);
        mark.style.setProperty("--game-y",movesGUI[i].y);
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
                mark.style.setProperty("--game-x",p.x);
                mark.style.setProperty("--game-y",p.y);
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