const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({extended:false});

function init(app, firebase){
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
    });
}
module.exports = init;