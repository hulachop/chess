const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const game = require('./utils/game.js');
const auth = require('./utils/auth.js');
const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended:false});

var admin = require("firebase-admin");

var serviceAccount = require("C:/Users/pawel/.ssh/szachy-4cdca-firebase-adminsdk-h5neq-0e4e7add55.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://szachy-4cdca-default-rtdb.europe-west1.firebasedatabase.app/"
});

const firebase = require('firebase/app');
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
                        let add = false;
                        let addId = null;
                        let changePlayer = false;
                        for(let i = 0; i < val.players.length; i++){
                            if(val.players[i] == 'any'){
                                changePlayer = true;
                                add = true;
                                addId = i;
                            }
                            if(val.players[i] == user.uid){
                                changePlayer = false;
                                add = true;
                                addId = i;
                                break;
                            }
                        }
                        if(add){
                            if(changePlayer){
                                val.players[addId] = user.uid;
                                snapshot.ref.child('players').set(val.players);
                            }
                            val.joined[addId] = true;
                            snapshot.ref.child('joined').set(val.joined);
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
                    if(val.players[val.turn] == user.uid) {
                        let ok = false;
                        for(const m of val.moves){
                            if(m.x == data.move.x && m.y == data.move.y && m.x2 == data.move.x2 && m.y2 == data.move.y2){
                                ok = true;
                                if(val.BCBN.moves == null) val.BCBN.moves = [];
                                val.BCBN.moves.push(data.move);
                                snapshot.ref.child('BCBN').child('moves').set(val.BCBN.moves);
                                val.turn++;
                                if(val.turn>1) val.turn=0;
                                snapshot.ref.child('turn').set(val.turn);
                                game.CalcMoves(data.gid, val.BCBN);
                                break;
                            }
                        }
                        if(!ok) socket.emit('moveError', 'Invalid move');
                    }
                    else socket.emit('moveError', "It's not your turn or you're not playing in this game");
                });
            }).catch(error => {
                console.log('error');
            })
        }).catch(error => {
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

app.post('/createGame', urlencodedParser, (req,res) => {
    admin.auth().verifyIdToken(req.body.token).then(decodedToken => {
        admin.auth().getUser(decodedToken.uid).then(user => {
            let db = admin.database();
            let key = game.createLobby(user.uid, req.query.o, db);
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

auth(app, firebase, admin);

server.listen(3000);