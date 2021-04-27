firebase.auth().onAuthStateChanged(user => {
    if(user == null) location.href = '/';
    var gid = getParameterByName('gid');
    if(gid==null) window.location.href = '/';
    var lobbyRef = database.ref('lobbies/'+gid);
    lobbyRef.on('child_removed', snapshot => {
        console.log('child removed!');
        window.location.reload();
    });
    
    var socket = io();
    
    socket.on('connect', () => {
        socket.on('joinError', (error) => {
            console.log('join error:',error);
        });
        user.getIdToken(true).then(token => {
            socket.emit('joinLobby', {gid,token});
        });
    });
});

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}