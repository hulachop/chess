import {FilterMoves, oob, cards, attackMap} from './game.js';
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

export {Pieces, Piece, Idx, inDir, v2d};