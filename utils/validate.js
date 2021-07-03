var admin;

var Cards = [
    {
        cost: 5,
        code: "SUPERPAWN"
    },
    {
        cost: 7,
        code: 'ENPASSANT'
    },
    {
        cost: 6,
        code: 'CASTLE'
    },
    {
        cost: 11,
        code: 'REVERSEPAWN'
    }
];

function validateCards(cards){
    try{
        cards = JSON.parse(cards);
        let cost = 0;
        cards.forEach(card => {
            let valid = false;
            for(let i = 0; i < Cards.length; i++){
                if(card == Cards[i].code) {
                    valid = true;
                    cost += Cards[i].cost;
                }
            }
            if(!valid) return null;
        });
        if(cost < 15) return cards.sort();
        else return null;
    } catch{
        return null
    }
}

module.exports = validateCards;