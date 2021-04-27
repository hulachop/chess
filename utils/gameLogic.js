var inputHandlers = new Array();
var turn = 0;
var pieces = new Array(64);
var attackMap = [new Array(64),new Array(64)];
var cards = new Array();
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
const Cards = {};
Cards.SUPERPAWN = function (color){
    this.color = color;
    this.name = 'SUPERPAWN';
}
Cards.SUPERPAWN.prototype = {
    OnInit: function(){},
    OnSpawn: function(){},
    OnMove: function(pieces, piece, from, to, dead){
        if(piece.color == this.color && piece.type == 1) piece.moved = true;
    },
    ChangeMoves: function(pieces, piece, moves){
        let nMoves = [];
        if(piece.color == this.color && piece.type == 1 && piece.moved == undefined){
            for(let i = 0; i < moves.length; i++){
                if(pieces[moves[i].idx()] == null){
                    let temp = moves[i].minus(piece.pos);
                    temp = piece.pos.plus(temp.times(2));
                    if(!oob(temp) && pieces[temp.idx()] == null) nMoves.push(temp);
                }
            }
        }
        for(let i = 0; i < nMoves.length; i++) moves.push(nMoves[i]);
    }
}
Cards.ENPASSANT = function(color){
    this.color = color;
    this.pos = null;
    this.from = null;
    this.piecePos = null;
    this.name = 'ENPASSANT';
}
Cards.ENPASSANT.prototype = {
    OnMove: function(pieces, piece, from, to, dead){
        if(piece.type == 1 && piece.color != this.color){
            let temp = to.minus(from);
            if(Math.abs(temp.y)>1){
                temp = from.plus(temp.times(0.5));;
                this.pos = temp;
                this.piecePos = to;
            }
        }
        if(this.pos != null && piece.color == this.color){
            if(piece.type == 1 && to.equals(this.pos)){
                let kill = false;
                piece.staticAttacks.forEach(attack => {
                    if(from.plus(inDir(attack,piece.dir)).equals(to)) kill = true; 
                })
                if(kill) pieces[this.piecePos.idx()] = null;
            }
            else{
                this.pos = null;
                this.from = null;
                this.piecePos = null;
            }
        }
    },
    ChangeMoves: function(pieces, piece, moves){
        if(this.pos != null && piece.type == 1 && piece.color == this.color){
            piece.staticAttacks.forEach(move => {
                let temp = piece.pos.plus(inDir(move,piece.dir));
                if(temp.equals(this.pos)){
                    moves.push(this.pos);
                    this.from = piece.pos;
                }
            })
        }
    },
}
Cards.CASTLE = function(color){
    this.color = color;
    this.name = 'CASTLE';
}
Cards.CASTLE.prototype = {
    ChangeMoves: function(pieces, piece, moves){
        if(piece.type == 6 && piece.moved == undefined && piece.color == this.color){
            let temp = piece.pos.clone();
            temp.x++;
            while(!oob(temp)){
                let p = pieces[temp.idx()];
                if(p == null) if(attackMap[NextColor(this.color)][temp.idx()]) break;
                if(p != null && p.type != 2) break;
                else if(p != null && p.moved == undefined) moves.push(piece.pos.plus(new v2d(2,0)));
                temp.x++;
            }
            temp = piece.pos.clone();
            temp.x--;
            while(!oob(temp)){
                let p = pieces[temp.idx()];
                if(p == null && attackMap[NextColor(this.color)][temp.idx()]) break;
                else if(p != null && p.type != 2) break;
                else if(p != null && p.moved == undefined) moves.push(piece.pos.plus(new v2d(-2,0)));
                temp.x--;
            }
        }
    },
    OnMove: function(pieces, piece, from, to, dead){
        if(piece.type == 6 && piece.color == this.color){
            piece.moved = true;
            let temp = to.minus(from);
            if(Math.abs(temp.x)>1){
                let d = temp.x*0.5;
                temp = piece.pos.clone();
                temp.x+=d;
                while(!oob(temp)){
                    if(pieces[temp.idx()] != null && pieces[temp.idx()].type == 2){
                        pieces[temp.idx()].pos = piece.pos.plus(new v2d(-d,0));
                        pieces[pieces[temp.idx()].pos.idx()] = pieces[temp.idx()];
                        pieces[temp.idx()] = null;
                        break;
                    }
                    temp.x+=d;
                }
            }
        }
        if(piece.type == 2 && piece.color == this.color) piece.moved = true;
    }
}
Cards.REVERSEPAWN = function(color){
    this.color = color;
    this.name = 'REVERSEPAWN';
}
Cards.REVERSEPAWN.prototype = {
    OnSpawn: function(pieces, piece){
        if(piece.type == 1 && piece.color == this.color){
            piece.overrideRules = true;
            piece.staticAttacks = [new v2d(0,1)];
            piece.rules.push(p => {
                let output = [];
                let temp = piece.pos.plus(inDir(new v2d(0,1),piece.dir));
                if(!oob(temp) && pieces[temp.idx()] != null) output.push(temp);
                temp = piece.pos.plus(inDir(new v2d(1,1),piece.dir));
                if(!oob(temp) && pieces[temp.idx()] == null) output.push(temp);
                temp = piece.pos.plus(inDir(new v2d(-1,1),piece.dir));
                if(!oob(temp) && pieces[temp.idx()] == null) output.push(temp);
                return output;
            });
        }
    }
}
const Pieces = {
    keys: ["none", "pawn", "rook", "knight", "bishop", "queen", "king"],
    none: 0,
    p: 1,
    r: 2,
    n: 3,
    b: 4,
    q: 5,
    k: 6
}

const DefaultRules = {
    none: function(){return [];},
    p: function(pieces, piece){
        let output = [];
        let temp = piece.pos.plus(inDir(new v2d(0,1),piece.dir));
        if(!oob(temp) && pieces[temp.idx()] == null) output.push(temp);
        temp = piece.pos.plus(inDir(new v2d(1,1),piece.dir));
        if(!oob(temp) && pieces[temp.idx()] != null) output.push(temp);
        temp = piece.pos.plus(inDir(new v2d(-1,1),piece.dir));
        if(!oob(temp) && pieces[temp.idx()] != null) output.push(temp);
        return output;
    },
    SlideMoves: function(pieces, pos, dirFilter){
        let output = [];
        for(let dirX = -1; dirX < 2; dirX++) for(let dirY = -1; dirY < 2; dirY++) if(dirFilter(dirX,dirY)){
            let temp = new v2d(pos.x + dirX,pos.y + dirY);
            while(!oob(temp)){
                if(pieces[temp.idx()] != null){
                    output.push(temp);
                    break;
                }
                output.push(temp);
                temp = temp.plus(dirX,dirY);
            }
        }
        return output;
    },
    r: function(pieces, piece){
        return this.SlideMoves(pieces, piece.pos, (dirX,dirY)=>{return ((dirY!=0)^(dirX!=0));});
    },
    b: function(pieces, piece){
        return this.SlideMoves(pieces, piece.pos, (dirX,dirY)=>{return (dirX!=0)&&(dirY!=0);});
    },
    q: function(pieces, piece){
        return this.SlideMoves(pieces, piece.pos, (dirX,dirY)=>{return (dirX!=0)||(dirY!=0);});
    },
    HORSE_MOVES: [new v2d(2,1),new v2d(1,2),new v2d(2,-1),new v2d(-2,1),new v2d(-2,-1),new v2d(-1,2),new v2d(1,-2),new v2d(-1,-2)],
    n: function(pieces, piece){
        let output = [];
        this.HORSE_MOVES.forEach(m => {
            let temp = piece.pos.plus(m);
            if(!oob(temp)) output.push(temp);
        });
        return output;
    },
    k: function(pieces, piece){
        let output = [];
        for(let dirX = -1; dirX < 2; dirX++) for(let dirY = -1; dirY < 2; dirY++) if((dirX!=0)||(dirY!=0)){
            let temp = new v2d(piece.pos.x + dirX, piece.pos.y + dirY);
            if(!oob(temp)) output.push(temp);
        }
        return output;
    }
}

function v2d(x,y){
    if(y == null && x != null){
        this.x = x % 8;
        this.y = (x-this.x)/8;
    }
    else{
        x == null ? this.x = 0 : this.x = x;
        y == null ? this.y = 0 : this.y = y;
    }
}
v2d.prototype = {
    plus: function(x,y){
        if(y==null){
            if(x.x != undefined) return new v2d(this.x+x.x,this.y+x.y);
            let i = (this.y*8)+this.x+x;
            X = i % 8;
            Y = (i-X)/8;
            return new v2d(X,Y);
        }
        else{
            return new v2d(this.x+x,this.y+y);
        }
    },
    minus: function(x,y){
        if(y==null){
            if(x.x != undefined) return new v2d(this.x-x.x,this.y-x.y);
            let i = (this.y*8)+this.x-x;
            X = i % 8;
            Y = (i-X)/8;
            return new v2d(X,Y);
        }
        else{
            return new v2d(this.x-x,this.y-y);
        }
    },
    times: function(value){
        return new v2d(this.x*value,this.y*value);
    },
    idx: function(){
        return (this.y*8)+this.x;
    },
    equals: function(other){
        return (other.x==this.x&&other.y==this.y);
    },
    clone: function(){
        return new v2d(this.x,this.y);
    }
}

function Piece(type, color, pos){
    this.typeName = type;
    this.type = Pieces[type];
    this.pos = pos;
    this.color = color;
    this.rules = new Array();
    this.moves = new Array();
    this.overrideRules = false;
    switch(color){
        case 0:
            this.dir = new v2d(0,1);
            break;
        case 1:
            this.dir = new v2d(0,-1);
            break;
    }
    if(this.type == 1){
        this.staticAttacks = [new v2d(1,1),new v2d(-1,1)];
    }
}
Piece.prototype = {
    idx: function(){
        return Idx(this.pos);
    },
    CalcMoves: function(pieces, noFilter){
        let moves = new Array();
        let temp;
        if(!this.overrideRules){
            temp = DefaultRules[this.typeName](pieces, this);
            for(let i = 0; i < temp.length; i++) moves.push(temp[i]);
        }
        for(let i = 0; i < this.rules.length; i++){
            temp = this.rules[i](pieces, this);
            for(let j = 0; j < temp.length; j++) moves.push(temp[j]);
        }
        cards.forEach(card => {
            if(card.ChangeMoves != undefined) card.ChangeMoves(pieces, this, moves);
        });
        if(noFilter == null){
            if(this.type!=1){
                moves.forEach(move => {
                    attackMap[this.color][move.idx()] = true;
                });
            }
            moves = FilterMoves(this.pos, moves);
            this.moves = moves;
        }
        return moves;
    }
}

function Idx(x,y){
    if(x.x!=undefined) return (x.y*8)+x.x;
    return (y*8)+x;
}

function inDir(v, dir){
    return new v2d((v.x*dir.y)-(v.y*dir.x),-((v.x*dir.x)+(v.y*dir.y)));
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
                    let temp = pieces[i].CalcMoves(pieces, true);
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
const oob = (pos) => !(pos.x > -1 && pos.x < 8 && pos.y > -1 && pos.y < 8);

function BCBNMoves(_bcbn){
    inputHandlers = new Array();
    turn = 0;
    pieces = new Array(64);
    attackMap = [new Array(64),new Array(64)];
    cards = new Array();
    
    LoadBCBN(_bcbn);
    return CalcMoves();
}

function LoadBCBN(bcbn){
    for(let i = 0; i < 2; i++) bcbn.cards[i].forEach(cardName => {cards.push(new Cards[cardName](i))});
    if(bcbn.SFEN != null) LoadFen(bcbn.SFEN);
    else LoadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    if (bcbn.moves != null) for(let i = 0; i < bcbn.moves.length; i++) MoveRaw(new v2d(bcbn.moves[i].x,bcbn.moves[i].y),new v2d(bcbn.moves[i].x2,bcbn.moves[i].y2));
}

function LoadFen(fen){
    let pos = new v2d(0,0);
    pieces = new Array(64);
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
        if (card.OnSpawn != undefined) card.OnSpawn(pieces, pieces[i]);
    });
}

function CalcMoves(){
    attackMap = [new Array(64),new Array(64)];
    let output = [];
    for(let i = 0; i < 64; i++) if(pieces[i] != null && pieces[i].color == turn) {
        let temp = pieces[i].CalcMoves(pieces);
        temp.forEach(elem => {
            output.push({
                x: pieces[i].pos.x,
                y: pieces[i].pos.y,
                x2: elem.x,
                y2: elem.y
            });
        });
    }
    return output;
}

function FilterMoves(pos, m){
    if(properties[turn].allowCheck == false) m = Filters.noCheck(pos, m);
    if(properties[turn].friendlyFire == false) m = Filters.noFriendlyFire(pos, m);
    return m;
}

function HandleInput(from, to){
    if(inputHandlers.length!=0){
        if(inputHandlers[0](to, from)){
            inputHandlers.shift();
            return true;
        }
        return false;
    }
    if((from != null)&&(from.x!=to.x||from.y!=to.y)){
        if(turn == pieces[from.idx()].color) return Move(from, to);
        return false;
    }
    return false;
}

function Move(from, to){
    let o = false;
    for(let i = 0; i < pieces[from.idx()].moves.length; i++){
        if(pieces[from.idx()].moves[i].x==to.x&&pieces[from.idx()].moves[i].y==to.y){
            let dead = pieces[to.idx()];
            pieces[to.idx()] = pieces[from.idx()];
            pieces[to.idx()].pos = new v2d(to.x,to.y);
            pieces[from.idx()] = null;
            cards.forEach(card => {
                if (card.OnMove != undefined) card.OnMove(pieces, pieces[to.idx()], from, to, dead);
            });
            NextTurn();
            o = true;
            break;
        }
    }
    return o;
}

function MoveRaw(from, to){
    let o = false;
    let dead = pieces[to.idx()];
    pieces[Idx(to.x,to.y)] = pieces[Idx(from.x,from.y)];
    pieces[Idx(to.x,to.y)].pos = new v2d(to.x,to.y);
    pieces[Idx(from.x,from.y)] = null;
    cards.forEach(card => {
        if (card.OnMove != undefined) card.OnMove(pieces, pieces[to.idx()], from, to, dead);
    });
    NextTurn();
    o = true;
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

module.exports = BCBNMoves;