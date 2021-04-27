var game = require('./gameLogic.js');

var admin;

function Init(_admin){
    admin = _admin;
    let db = admin.database();
    db.ref('lobbies').on('child_changed', snapshot => {
        let val = snapshot.val();
        let full = true;
        for(let i = 0; i < val.joined.length; i++){
            if(val.joined[i] == false){
                full=false;
                break;
            }
        }
        if(full){
            createGame(val.players[0],val.players[1],snapshot.ref.key);
            snapshot.ref.set(null);
        }
    });
}

function createLobby(uid, uid2){
    let db = admin.database();
    if(uid==null)uid = 'any';
    if(uid2 == null)uid2 = 'any';
    var lobby = {
        players: [
            uid,
            uid2
        ],
        joined: [
            false,
            false
        ]
    }
    let key = db.ref('lobbies').push(lobby).key;
    
    return key;
}

function createGame(uid, uid2, key){
    let db = admin.database();
    let bcbn = {
        SFEN: null,
        moves: null,
        cards: [
            ['SUPERPAWN', 'ENPASSANT', 'CASTLE'],
            ['SUPERPAWN', 'ENPASSANT', 'CASTLE']
        ]
    }
    let moves = game(bcbn);
    var gameJson = {
        BCBN: bcbn,
        players: [
            uid,
            uid2
        ],
        moves: moves,
        turn: 0
    }
    db.ref('games/' + key).set(gameJson);
}

function CalcMoves(gid, bcbn){
    let moves = game(bcbn);
    admin.database().ref('games/'+gid+'/moves').set(moves);
}

module.exports = {Init, createLobby, CalcMoves};