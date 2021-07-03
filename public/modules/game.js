import {Pieces, Piece, Idx, inDir, v2d} from './helper.js';
import Cards from './cards.js';
var inputHandlers = new Array();
var turn = 0;
var pieces = new Array(64);
var attackMap = [new Array(64),new Array(64)];
var cards = new Array();
var state = null;
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
var oob = (pos) => !(pos.x > -1 && pos.x < 8 && pos.y > -1 && pos.y < 8);

function Init(bcbn){
    LoadBCBN(bcbn);
    CalcMoves();
}

function LoadBCBN(bcbn){
    for(let i = 0; i < 2; i++) bcbn.cards[i].forEach(cardName => {cards.push(new Cards[cardName](i))});
    if(bcbn.SFEN != null) LoadFen(bcbn.SFEN);
    else LoadFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
    if(bcbn.moves != null) for(let i = 0; i < bcbn.moves.length; i+=4){
        MoveRaw(new v2d(bcbn.moves[i]-0,bcbn.moves[i+1]-0), new v2d(bcbn.moves[i+2]-0, bcbn.moves[i+3]-0));
    }
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
    attackMap = [new Array(64), new Array(64)];
    let opponent = NextColor(turn);
    for(let i = 0; i < 64; i++) if(pieces[i] != null && pieces[i].color == opponent) {
        pieces[i].CalcMoves(pieces);
    }
    for(let i = 0; i < 64; i++) if(pieces[i] != null && pieces[i].color == turn) {
        pieces[i].CalcMoves(pieces);
    }
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
            pieces[Idx(to.x,to.y)] = pieces[Idx(from.x,from.y)];
            pieces[Idx(to.x,to.y)].pos = new v2d(to.x,to.y);
            pieces[Idx(from.x,from.y)] = null;
            cards.forEach(card => {
                if (card.OnMove != undefined) card.OnMove(pieces, pieces[to.idx()], from, to, dead);
            });
            NextTurn();
            CalcMoves();
            state = CheckState(turn);
            o = true;
            break;
        }
    }
    return o;
}

function CheckState(color){
    let cantMove = true;
    let kingPos;
    for(let i = 0; i < 64; i++) if(pieces[i]!=null && pieces[i].color == color) {
        if(pieces[i].type == 6) kingPos = pieces[i].pos;
        if(pieces[i].moves.length > 0){
            cantMove = false;
            if(kingPos != null) break;
        }
    }
    let checked = attackMap[NextColor(color)][kingPos.idx()];
    if(checked&&cantMove) return "checkmate";
    if(!checked&&cantMove) return "stalemate";
    return null;
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

export {Init, oob, CalcMoves, Move, NextTurn, NextColor, HandleInput, FilterMoves, pieces, cards, attackMap, turn, state};