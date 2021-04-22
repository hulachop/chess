const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const game = require('./utils/game.js');

const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');
const firebaseConfig = {
    apiKey: "AIzaSyAeGqIuf7xILEYyIvnV6OGKu7KXNqw0lcA",
    authDomain: "szachy-4cdca.firebaseapp.com",
    projectId: "szachy-4cdca",
    storageBucket: "szachy-4cdca.appspot.com",
    messagingSenderId: "448070597711",
    appId: "1:448070597711:web:d5a05c74d490dd5c44be3a",
    measurementId: "G-2L6DEGPG5G"
  };
firebase.initializeApp(firebaseConfig);

const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended:false});

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));

io.on('connection', socket => {
    game(socket);
});

app.get('/', (req,res) => {
    res.render('game');
});

app.get('/login', (req,res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/login', urlencodedParser, (req, res) => {
    console.log(req.body);
    firebase.auth().signInWithEmailAndPassword(req.body.email,req.body.password)
        .then( userCredential => {
            console.log('zalogowano pomyslnie');
        })
        .catch(error => {
            console.log('ERROR!');
            console.log(error.message);
        });
    res.render('login');
});

app.post('/register', urlencodedParser, (req,res) => {
    firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then( userCredential => {
            console.log('zarejestrowano!');
            console.log(userCredential.user);
        })
        .catch( error => {
            console.log('ERROR!');
            console.log(error.message);
        });
    res.render('register');
})

server.listen(3000);