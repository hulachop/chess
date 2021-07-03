const bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended:false});

function init(app, firebase, admin){
    app.get('/login', (req,res) => {
        res.render('login');
    });
    
    app.get('/register', (req, res) => {
        res.render('register',{error:'gowno gowno'});
    });

    app.post('/register', urlencodedParser, (req, res) => {
        admin.auth().createUser({
            email: req.body.email,
            password: req.body.password,
            displayName: req.body.username
        }).then(user => {
            admin.auth().updateUser(user.uid, {
                displayName: req.body.username
            });
            admin.database().ref('users/'+user.uid).set({
                username: req.body.username,
                ranking: 1500,
                friends: {
                    pawelpolak:true,
                    pawelpolak2:true
                }
            });
            res.render('home');
        }).catch(error => {
            console.log('ERROR!');
            console.log(error.message);
            res.render('register', {error:error.message});
        });
    });
}
module.exports = init;