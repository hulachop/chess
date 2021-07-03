
Cards = [
    {
        name: "super&nbsp;pawns",
        description:"your pawns can move 2 times farther on their first move",
        cost: 5,
        code: "SUPERPAWN"
    },
    {
        name: 'en&nbsp;passant',
        description: 'google en passant',
        cost: 7,
        code: 'ENPASSANT'
    },
    {
        name: 'castle',
        description: 'you can castle',
        cost: 6,
        code: 'CASTLE'
    },
    {
        name: 'stupid&nbsp;pawns',
        description: 'pawns move diagonally and take forward',
        cost: 11,
        code: 'REVERSEPAWN'
    }
];

var deckJs = [];

const deckId = getParameterByName('k');
if(deckId == null) location.href = '/decks';

var deckCost = 0;
updateDeckCost();

const cardContainer = document.getElementById('card-container');
const deck = document.getElementById('deck');
const form = document.getElementById('deckedit-form');
form.action = "/deck?k="+deckId;

firebase.auth().onAuthStateChanged(user => {
    if(user == null) location.href = "/";
    else{
        database.ref("users/"+user.uid+"/decks/"+deckId).get().then(snapshot => {
            let val = snapshot.val();
            if(val == null) location.href = "/decks";
            else{
                form[0].value = val.name;
                Cards.forEach(card => {
                    let elem = createCardElem(card);
                    val.cards.forEach(chosen => {
                        if(chosen == card.code) AddCard(card, elem);
                    });
                    cardContainer.appendChild(elem);
                });
            }
        }).catch(error => {
            location.href = "/decks";
        });
        form[2].value = deckId;
    }
})

function createCardElem(card){
    let cardElem = document.createElement('div');
    cardElem.classList.add('col');
    cardElem.classList.add('s3');
    cardElem.cardName = card.name;
    cardElem.cardCode = card.code;
    cardElem.innerHTML = `<div class="card hoverable blue darken-1" style="padding: 10px; cursor: pointer; max-height: 300px; min-height: 300px;">
    <div class="card-image">
        <img class="circle" src="anger.jpg" alt="anger">
    </div>
    <div class="card-content">
        <span class="card-title center">`+card.name+`</span>
        <p class="center">`+card.description+`</p>
    </div>
</div>`
    cardElem.addEventListener('click', e => {
        AddCard(card, cardElem);
    });
    return cardElem;
}

function AddCard(card, cardElem){
    deckJs.push(card.code);
    createDeckElement(card, cardElem);
    deckCost += card.cost;
    updateDeckCost();
    disableCardElem(cardElem);
    form[3].value = JSON.stringify(deckJs);
}

function RemoveCard(card, cardElem, deckElem){
    activateCardElem(cardElem);
    deckCost -= card.cost;
    updateDeckCost();
    deck.removeChild(deckElem);
    let newDeck = [];
    deckJs.forEach(cardCode => {
        if(cardCode != card.code) newDeck.push(cardCode);
    });
    deckJs = newDeck;
    form[3].value = JSON.stringify(deckJs);
}

function createDeckElement(card, cardElem){
    let deckElem = document.createElement('a');
    deckElem.classList.add('collection-item');
    deckElem.classList.add('black-text');
    deckElem.innerHTML = '<span class="badge">'+card.cost+'</span>'+card.name;
    deckElem.style.cursor = 'pointer';
    deckElem.addEventListener('click', e => {
        RemoveCard(card, cardElem, deckElem);
    });
    deck.appendChild(deckElem);
}

function disableCardElem(elem){
    elem.children[0].classList.add('darken-3');
    elem.style.pointerEvents = 'none';
    elem.style.cursor = 'none';
}

function activateCardElem(elem){
    elem.children[0].classList.remove('darken-3');
    elem.style.pointerEvents = 'auto';
    elem.style.cursor = 'pointer';
}

function updateDeckCost(){
    var elem = document.getElementById('deck-cost');
    if(deckCost > 15){
        elem.style.width = '100%';
        elem.classList.remove('green');
        elem.classList.add('red');
    }
    else{
        elem.style.width = 'calc('+deckCost+'*100%/15)';
        elem.classList.remove('red');
        elem.classList.add('green');
    }
    elem.innerHTML = deckCost + '/15';
}

function validateDeck(){
    if(form['name'] == '') alert('gowno');
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}