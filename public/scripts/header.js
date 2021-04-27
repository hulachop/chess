firebase.auth().onAuthStateChanged(user => {
    let loggedElements = document.getElementsByClassName('logged-in');
    let loggedOutElements = document.getElementsByClassName('logged-out');
    for(const elem of loggedElements) elem.classList.remove('hidden');
    for(const elem of loggedOutElements) elem.classList.remove('hidden');
    if(user!=null){
        for(const elem of loggedOutElements) elem.classList.add('hidden');
        document.getElementById('hello').innerHTML = 'czesc ' + user.displayName + '!';
    }
    else{
        for(const elem of loggedElements) elem.classList.add('hidden');
    }
});
document.getElementById('logout-button').addEventListener('click', e => {
    if(firebase.auth().currentUser == null) location.href = '/';
    firebase.auth().signOut().then(()=>{
        location.href = '/';
    });
});