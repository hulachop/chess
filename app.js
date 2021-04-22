const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const game = require('./utils/game.js');

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
    let user = firebase.auth().currentUser;
    database.ref('users/username/one').set('paweldebil');
    res.render('game', {user});
});

app.get('/login', (req,res) => {
    let user = firebase.auth().currentUser;
    if(user != null) res.redirect('/');
    res.render('login', {user});
});

app.get('/register', (req, res) => {
    let user = firebase.auth().currentUser;
    if(user != null) firebase.auth().signOut();
    res.render('register', {user:null});
});

app.get('/about', (req, res) => {
    let user = firebase.auth().currentUser;
    res.render('about', {user});
})

app.post('/login', urlencodedParser, (req, res) => {
    firebase.auth().signInWithEmailAndPassword(req.body.email,req.body.password)
        .then( userCredential => {
            res.redirect('/');
        })
        .catch(error => {
            console.log('ERROR!');
            console.log(error.message);
            res.render('login',{user:null});
        });
});

app.post('/register', urlencodedParser, (req,res) => {
    firebase.auth().createUserWithEmailAndPassword(req.body.email, req.body.password)
        .then( userCredential => {
            userCredential.user.updateProfile({
                displayName: req.body.username
            });
            database.ref('users/'+userCredential.user.uid).update({
                username: req.body.username,
                ranking: 1500,
                friends: [
                    "pawel",
                    "karol",
                    "adi"
                ]
            });
            res.redirect('/');
        })
        .catch( error => {
            console.log('ERROR!');
            console.log(error.message);
            res.render('register',{user:null});
        });
});

app.get('/logout', (req,res) => {
    firebase.auth().signOut().then(()=>{
        res.redirect('/');
    }).catch(error => {
        res.redirect('/'); 
    });
})

server.listen(3000);