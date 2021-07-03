var game = require('./gameLogic.js');

var admin;

function Init(_admin){
    admin = _admin;
    let db = admin.database();
    db.ref('lobbies').on('child_changed', snapshot => {
        let val = snapshot.val();
        if(val.joined != null && Object.keys(val.joined).length == val.maxPlayers){
            createGame(val.players,snapshot.ref.key);
            snapshot.ref.child('joined').set(null);
            snapshot.ref.set(null);
        }
    });
}

function createLobby(players, name){
    let public = null;
    if(players[0]==null||players[1]==null) public = true;
    let db = admin.database();
    var lobby = {
        public:public,
        name: name,
        players: {},
        maxPlayers: 2
    }
    for(let i = 0; i < 2; i++) if(players[i]!=null) lobby.players[players[i]] = true;
    let key = db.ref('lobbies').push(lobby).key;
    
    return key;
}

function createGame(players, key){
    let db = admin.database();
    let bcbn = {
        SFEN: null,
        moves: null,
        cards: [
            ['SUPERPAWN', 'ENPASSANT', 'CASTLE'],
            ['SUPERPAWN', 'ENPASSANT', 'CASTLE']
        ]
    }
    let gameData = game(bcbn);
    var gameJson = {
        BCBN: bcbn,
        players: Object.keys(players),
        moves: gameData.moves,
        state: 'live',
        turn: 0
    }
    db.ref('games/' + key).set(gameJson);
}

function CalcMoves(gid, bcbn){
    let gameData = game(bcbn);
    if(gameData.moves == '') gameData.moves = null;
    admin.database().ref('games/'+gid+'/moves').set(gameData.moves);
    return gameData.state;
}

module.exports = {Init, createLobby, CalcMoves};