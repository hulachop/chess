const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const game = require('./utils/game.js');
const auth = require('./utils/auth.js');
const bodyParser = require('body-parser');
const validateCards = require('./utils/validate.js');

var urlencodedParser = bodyParser.urlencoded({extended:false});

var admin = require("firebase-admin");

var serviceAccount = require("C:/Users/pawel/.ssh/szachy-4cdca-firebase-adminsdk-h5neq-0e4e7add55.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://szachy-4cdca-default-rtdb.europe-west1.firebasedatabase.app/"
});

const firebase = require('firebase/app');
const { stat } = require('fs');
require('firebase/auth');
require('firebase/firestore');
require('firebase/database');
const firebaseConfig = {
    apiKey: "AIzaSyAeGqIuf7xILEYyIvnV6OGKu7KXNqw0lcA",
    authDomain: "szachy-4cdca.firebaseapp.com",
    projectId: "szachy-4cdca",
    storageBucket: "szachy-4cdca.appspot.com",
    messagingSenderId: "448070597711",
    appId: "1:448070597711:web:d5a05c74d490dd5c44be3a",
    databaseURL: "https://szachy-4cdca-default-rtdb.europe-west1.firebasedatabase.app/",
    measurementId: "G-2L6DEGPG5G"
  };
firebase.initializeApp(firebaseConfig);

const database = firebase.database();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));

game.Init(admin);

io.on('connection', socket => {
    socket.on('joinLobby', data => {
        if(data.gid != null && data.token != null){
            admin.auth().verifyIdToken(data.token).then(decodedToken => {
                admin.auth().getUser(decodedToken.uid).then(user => {
                    let db = admin.database();
                    db.ref('lobbies/'+data.gid).get().then(snapshot => {
                        let val = snapshot.val();
                        let updateVal = {};
                        updateVal[user.uid] = true;
                        if(val.public != null){
                            if(val.players[user.uid] != null){
                                snapshot.ref.child('joined').update(updateVal);
                            }
                            else if(Object.keys(val.players).length < val.maxPlayers){
                                snapshot.ref.child('players').update(updateVal);
                                snapshot.ref.child('joined').update(updateVal);
                            }
                        }
                        else{
                            if(val.players[user.uid] != null) snapshot.ref.child('joined').update(updateVal);
                        }
                    });
                });
            }).catch(error => {
                console.log('ERROR!');
                console.log(error.message);
            });
        } else {
            socket.emit('joinError', 'error');
        }
    });
    socket.on('makeMove', data => {
        if(data.gid != null && data.token != null && data.move != null) admin.auth().verifyIdToken(data.token).then(decodedToken => {
            io.to(data.gid).emit('move', {move: data.move, from: decodedToken.uid});
            admin.auth().getUser(decodedToken.uid).then(user => {
                let db = admin.database();
                db.ref('games/'+data.gid).get().then(snapshot => {
                    let val = snapshot.val();
                    if(val.state == 'live'){
                        if(val.players[val.turn] == user.uid) {
                            let ok = false;
                            for(let i = 0; i < val.moves; i+=4){
                                if(val.moves[i] == data.move.x && val.moves[i+1] == data.move.y && val.moves[i+2] == data.move.x2 && val.moves[i+3] == data.move.y2){
                                    ok = true;
                                    if(val.BCBN.moves == null) val.BCBN.moves = "";
                                    val.BCBN.moves += "" + data.move.x + data.move.y + data.move.x2 + data.move.y2;
                                    if(val.BCBN.moves == "") val.BCBN.moves = null;
                                    snapshot.ref.child('BCBN').child('moves').set(val.BCBN.moves);
                                    let state = game.CalcMoves(data.gid, val.BCBN);
                                    if(state != null){
                                        snapshot.ref.child('state').set(state);
                                        if(state == 'checkmate') snapshot.ref.child('winner').set(val.turn);
                                        snapshot.ref.child('turn').set(null);
                                    }
                                    else{
                                        val.turn++;
                                        if(val.turn>1) val.turn=0;
                                        snapshot.ref.child('turn').set(val.turn);
                                    }
                                    break;
                                }
                            }
                            if(!ok) socket.emit('moveError', 'Invalid move');
                        }
                        else socket.emit('moveError', "It's not your turn or you're not playing in this game");
                    }
                    else{
                        socket.emit('moveError','the game has already ended');
                    }
                });
            }).catch(error => {
                console.log('error');
            })
        }).catch(error => {
            if(error.code == 'auth/invalid-user-token')socket.emit('tokenError');
            socket.emit('moveError', error.message);
            console.log('ERROR!');
            console.log(error.message);
        })
    });
    socket.on('joinGame', gid => {
        socket.join(gid);
    });
});

app.get('/', (req,res) => {
    res.render('home');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/deck', (req,res) => {
    res.render('deck');
});

app.post('/deck', urlencodedParser, (req, res) => {
    admin.auth().verifyIdToken(req.body.token).then(decodedToken => {
        let db = admin.database();
        if(req.query.k == null){
            let key = db.ref('users/'+decodedToken.uid+'/decks').push({
                name:'new deck',
                cards: ['CASTLE','ENPASSANT','SUPERPAWN']
            }).key;
            res.redirect('/deck?k='+key);
        }
        else{
            let cards = validateCards(req.body.data);
            if(cards == null){
                res.render("deck")
                return;
            }
            let newDeck = {cards};
            if(req.body.name != null) newDeck.name = req.body.name;
            db.ref("users/"+decodedToken.uid+"/decks/"+req.body.did).update(newDeck)
            res.render("deck");
        }
    }).catch(error => {
        console.log("ERROR!")
        console.log(error.message)
    })
})

app.get('/decks', (req, res) => {
    res.render('decks');
})

app.post('/createGame', urlencodedParser, (req,res) => {
    let private = (req.body.opponent != null);
    admin.auth().verifyIdToken(req.body.token).then(decodedToken => {
        admin.auth().getUser(decodedToken.uid).then(user => {
            let db = admin.database();
            let key = game.createLobby([user.uid, req.body.opponent], req.body.name);
            res.redirect('/game?gid='+key);
        }).catch(error => {
            console.log('ERROR2!');
            console.log(error.message);
        })
    }).catch(error => {
        console.log('ERROR!');
        console.log(error.message);
    })
});

app.get('/game', (req,res) => {
    let db = admin.database(); 
    if (req.query.gid != null){
        db.ref('games/' + req.query.gid).get().then(snapshot => {
            if(snapshot.exists()) res.render('game');
            else{
                db.ref('lobbies/' + req.query.gid).get().then(snapshot => {
                    if(snapshot.exists()) res.render('lobby');
                    else res.redirect('/');
                });
            }
        })
    }
    else res.redirect('/');
});

app.get('/profile', (req,res) => {
    res.render('profile');
})

auth(app, firebase, admin);

server.listen(3000);