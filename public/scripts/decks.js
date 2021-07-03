const decksElem = document.getElementById('decks-elem');

firebase.auth().onAuthStateChanged(user => {
    if(user!=null){
        database.ref('users/'+user.uid+'/decks').get().then(snapshot => {
            let val = snapshot.val();
            if(val == null){
                let message = document.createElement('p');
                message.classList.add('center');
                message.colspan = 4;
                message.innerHTML = "you don't have any decks yet!";
                decksElem.appendChild(message);
            }
            else{
                let keys = Object.keys(val);
                keys.forEach(key => {
                    decksElem.appendChild(createDeckElement(val[key], key));
                });
            }
        })
    }
    else location.href = '/';
})

function createDeckElement(object, key){
    let elem = document.createElement('tr');
    elem.innerHTML = `<td>`+object.name+`</td>
    <td>`+object.cards.length+`</td>
    <td><a href="/deck?k=`+key+`" class="btn blue darken-1">edit</a></td>
    <td><a href="#" class="btn blue darken-1">delete</a></td>`;
    return elem;
}