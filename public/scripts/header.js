firebase.auth().onAuthStateChanged(user => {
    let loggedElements = document.getElementsByClassName('logged-in');
    let loggedOutElements = document.getElementsByClassName('logged-out');
    for(const elem of loggedElements) elem.classList.remove('hide');
    for(const elem of loggedOutElements) elem.classList.remove('hide');
    if(user!=null){
        user.getIdToken().then(token => {
            for(const elem of document.getElementsByClassName('token')) elem.value = token;
        });
        for(const elem of loggedOutElements) elem.classList.add('hide');
        let loginModal = M.Modal.getInstance(document.getElementById('login-modal'));
        loginModal.close();
    }
    else{
        for(const elem of loggedElements) elem.classList.add('hide');
    }
});
document.getElementById('logout-button').addEventListener('click', e => {
    if(firebase.auth().currentUser == null) location.href = '/';
    firebase.auth().signOut().then(()=>{
        location.href = '/';
    });
});