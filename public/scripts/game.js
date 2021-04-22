oob = function(pos){
    return !(pos.x > -1 && pos.x < 8 && pos.y > -1 && pos.y < 8);
}

var inputHandlers = new Array();
var turn = 0;

pieces = new Array(64);
attackMap = [new Array(64),new Array(64)];
cards = new Array();
cards.push(new Cards["SUPERPAWN"](0));
cards.push(new Cards.SUPERPAWN(1));
cards.push(new ENPASSANT(0));
cards.push(new CASTLE(0));
cards.push(new ENPASSANT(1));
cards.push(new CASTLE(1));
cards.push(new REVERSEPAWN(0));

var properties = [
    {
        friendlyFire: false,
        allowCheck: false
    },
    {
        friendlyFire: false,
        allowCheck: false
    }
];

function printBoard(){
    console.log(JSON.stringify(pieces));
}

const Filters = {
    noCheck: function(pos, m){
        let output = [];
        let opponent = NextColor(turn);
        for(let mi = 0; mi < m.length; mi++){
            //do the move
            let tempPiece = pieces[m[mi].idx()];
            pieces[m[mi].idx()] = pieces[pos.idx()];
            pieces[pos.idx()] = null;

            let add = true;
            for(let i = 0; i < 64; i++){
                if(pieces[i] != null && pieces[i].color == opponent){
                    let b = false;
                    let temp = pieces[i].CalcMoves(true);
                    for(let j = 0; j < temp.length; j++){
                        let piece = pieces[temp[j].idx()];
                        if(piece != null && piece.type == 6 && piece.color == turn){
                            b = true;
                            add = false;
                            break;
                        }
                    }
                    if(b)break;
                }
            }
            if(add)output.push(m[mi]);

            //undo the move
            pieces[pos.idx()] = pieces[m[mi].idx()];
            pieces[m[mi].idx()] = tempPiece;
        }
        return output;
    },
    noFriendlyFire: function(pos, m){
        let output = [];
        for(let i = 0; i < m.length; i++){
            let add = true;
            let piece = pieces[m[i].idx()];
            if(piece != null && piece.color == turn) add = false;
            if(add) output.push(m[i]);
        }
        return output;
    }
}

var fen = getParameterByName("f");
if(fen == null) LoadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
else LoadFen(fen);
CalcMoves();

function LoadFen(fen){
    let pos = new v2d(0,0);
    pieces = new Array(64);
    console.log(fen.length);
    for(let i = 0; i < fen.length; i++){
        if(fen[i] == '/'){
            pos.y += 1;
            pos.x = 0;
            continue;
        }
        if(fen[i] == ' ') break;
        if(fen[i] >= '0' && fen[i] <= '9'){
            pieces.fill(null,pos.idx(),pos.idx()+fen[i]);
            pos.x += fen[i] - 0;
            continue;
        }

        if(fen.charAt(i) == fen.charAt(i).toUpperCase()) pieces[pos.idx()] = new Piece(fen[i].toLowerCase(),0,new v2d(pos.x,pos.y));
        else pieces[pos.idx()] = new Piece(fen[i],1,new v2d(pos.x,pos.y));
        pos.x++;
    }
    for(let i = 0; i < 64; i++) if (pieces[i]!=null) cards.forEach(card => {
        if (card.OnSpawn != undefined) card.OnSpawn(pieces[i]);
    });
    DrawBoard();
}

function CalcMoves(){
    attackMap = [new Array(64),new Array(64)];
    for(let i = 0; i < 64; i++) if(pieces[i] != null) {
        pieces[i].CalcMoves();
    }
}

function FilterMoves(pos, m){
    if(properties[turn].allowCheck == false) m = Filters.noCheck(pos, m);
    if(properties[turn].friendlyFire == false) m = Filters.noFriendlyFire(pos, m);
    return m;
}

function InputHandler(){
    if(inputHandlers.length!=0){
        if(inputHandlers[0](to, from)) return inputHandlers.shift();
    }
    if((from == null)||(from.x==to.x&&from.y==to.y)){
        if(movesGUI!=null) movesGUI = [];
        return false;
    }
    else{
        if(turn == pieces[from.idx()].color) return Move();
        return false;
    }
}

function Move(){
    let o = false;
    for(let i = 0; i < movesGUI.length; i++){
        if(movesGUI[i].x==to.x&&movesGUI[i].y==to.y){
            let dead = pieces[to.idx()];
            pieces[idx(to.x,to.y)] = pieces[idx(from.x,from.y)];
            pieces[idx(to.x,to.y)].pos = new v2d(to.x,to.y);
            pieces[idx(from.x,from.y)] = null;
            cards.forEach(card => {
                if (card.OnMove != undefined) card.OnMove(pieces[to.idx()], from, to, dead);
            });
            from = null;
            movesGUI = [];
            DrawBoard();
            DrawMarks();
            NextTurn();
            CalcMoves();
            o = true;
            break;
        }
    }
    if(!o){
        from = null;
        movesGUI = [];
        DrawMarks();
    }
    return o;
}

function NextTurn(){
    turn++;
    if(turn > 1) turn = 0;
}

function NextColor(color){
    color++;
    if(color > 1) return 0;
    return color;
}