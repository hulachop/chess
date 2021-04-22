const Cards = {};
Cards.SUPERPAWN = function (color){
    this.color = color;
    this.name = 'SUPERPAWN';
}
Cards.SUPERPAWN.prototype = {
    OnInit: function(){},
    OnSpawn: function(){},
    OnMove: function(piece, from, to, dead){
        if(piece.color == this.color && piece.type == 1) piece.moved = true;
    },
    ChangeMoves: function(piece, moves){
        let nMoves = [];
        if(piece.color == this.color && piece.type == 1 && piece.moved == undefined){
            for(let i = 0; i < moves.length; i++){
                if(pieces[moves[i].idx()] == null){
                    let temp = moves[i].minus(piece.pos);
                    temp = piece.pos.plus(temp.times(2));
                    if(pieces[temp.idx()] == null) nMoves.push(temp);
                }
            }
        }
        for(let i = 0; i < nMoves.length; i++) moves.push(nMoves[i]);
    }
}
function ENPASSANT(color){
    this.color = color;
    this.pos = null;
    this.from = null;
    this.piecePos = null;
    this.name = 'ENPASSANT';
}
ENPASSANT.prototype = {
    OnMove: function(piece, from, to, dead){
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
    ChangeMoves: function(piece, moves){
        if(this.pos != null && piece.type == 1 && piece.color == this.color){
            piece.staticAttacks.forEach(move => {
                let temp = piece.pos.plus(inDir(move,piece.dir));
                if(temp.equals(this.pos)){
                    moves.push(this.pos);
                    from = piece.pos;
                }
            })
        }
    },
}
function CASTLE(color){
    this.color = color;
    this.name = 'CASTLE';
}
CASTLE.prototype = {
    ChangeMoves: function(piece, moves){
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
    OnMove: function(piece, from, to, dead){
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
function REVERSEPAWN(color){
    this.color = color;
    this.name = 'REVERSEPAWN';
}
REVERSEPAWN.prototype = {
    OnSpawn: function(piece){
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