const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const game = require('./utils/game.js');
const auth = require('./utils/auth.js');

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

io.on('connection', socket => {
    game(socket);
    socket.on('update', () => {
        console.log(firebase.auth().currentUser.displayName, 'connected with websockets!?');
    });
});

app.get('/', (req,res) => {
    let user = firebase.auth().currentUser;
    res.render('game', {user});
});

app.get('/about', (req, res) => {
    let user = firebase.auth().currentUser;
    res.render('about', {user});
});

auth(app, firebase);

server.listen(3000);