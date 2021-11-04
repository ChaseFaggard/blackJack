const axios = require("axios");
const prompt = require("prompt-sync")();
const { DbService } = require("m3o/db");
M3O_API_TOKEN = 'ZThkODVmMDYtZjM0MS00ZTM2LTgwODEtMjlkODllZjFiMjdl';

let win, lose;

const URL = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1`;

const getNewDeck = async () => {
    const response = await axios(URL);
    return response.data;
}

const main = async () => {

    try {
        const response = await createRecord();

     } catch(e) { console.error(e); }

    let restart  = true
    while(restart) {

        const newDeck = await getNewDeck();
        const deckId = newDeck.deck_id;

        const deckData = await axios(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=52`);
        const deck = Object.entries(deckData.data.cards);


        const playerHand = [], dealerHand = []; // Initalize the hands

        // Give each player two cards
        playerHand.push(deck.pop());
        playerHand.push(deck.pop());

        dealerHand.push(deck.pop());
        dealerHand.push(deck.pop());

        console.log("The dealer's face up card was: ", printCard(dealerHand[0][1]));
        console.log("Your first two cards were: ", printCard(playerHand[1][1]) + " and " + printCard(playerHand[0][1]));
        console.log("Total hand value: ", getHandValue(playerHand));

        let keepPlaying = true;

        while(keepPlaying) {
            
            let answer = prompt('Do you want to stand or hit? ');

            if(answer.toLowerCase() == "stand") { // Try your luck now
                playerHandValue = getHandValue(playerHand);
                dealerHandValue = getHandValue(dealerHand);

                console.log(`Your total hand value was ${playerHandValue} while the dealer's was ${dealerHandValue}`);

                if(playerHandValue > dealerHandValue) {
                    console.log("You win!");
                    const record = await readRecords();
                    wins = record.records[0].win + 1;
                    losses = record.records[0].loss;
                    const submit = await updateRecord();
                } 
                else {
                    console.log("You lose!");
                    const record = await readRecords();
                    wins = record.records[0].win;
                    losses = record.records[0].loss + 1;
                    const submit = await updateRecord();
                }
                keepPlaying = false; 
            }

            else if(answer.toLowerCase() == "hit") { // Get another card!
                playerHand.push(deck.pop());
                console.log("Your new card is a(n): ", printCard(playerHand[playerHand.length-1][1]));
                let handValue = getHandValue(playerHand);
                console.log("Your new total hand value: ", handValue);
                if(handValue > 21) { 
                    console.log("You went over 21! You lose!");
                    keepPlaying = false;
                    const record = await readRecords();
                    wins = record.records[0].win;
                    losses = record.records[0].loss + 1;
                    const submit = await updateRecord();
                }
            }
        }

        const record = await readRecords();
        console.log(`You have ${record.records[0].win} wins and ${record.records[0].loss} losses.`);

        let answer = prompt('Do you want to play again? ');
        if(answer.toLowerCase() == "no") { restart = false; }
    }   

}

const printCard = (card) => {
    return `${card.value} of ${card.suit}`;
}

const getCardValueInt = (value) => {
    if(isNaN(value)) {
        return 10;
    }
   else return Number(value);
}

const getHandValue = (hand) => {
    let total = 0;
    for (let i = 0; i < hand.length; i++) {
        total += getCardValueInt(hand[i][1].value);
    }
    return total;
}


// Database services code
const createRecord = async () => {
    let dbService = new DbService(M3O_API_TOKEN);
    let rsp = await dbService.create({
        record: {
            win:0,
            loss:0,
        },
        table: "WinLoss",
    });
    return rsp.id;
}

const readRecords = async () => {
    let dbService = new DbService(M3O_API_TOKEN);
    let rsp = await dbService.read({
        table: "WinLoss",
        id: "1",
    });
    return rsp;
}

const updateRecord = async () => {
    let dbService = new DbService(M3O_API_TOKEN);
    let rsp = await dbService.update({
        record: {
            win: wins,
            loss: losses,
            id: "1"
        },
        table: "WinLoss"
    });
    return rsp;
}

main();



