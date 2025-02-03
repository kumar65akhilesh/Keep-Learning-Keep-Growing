function rollDice() {
    var player1 = Math.floor(Math.random()*6)+1;
    var player2 = Math.floor(Math.random()*6)+1;
    document.querySelector(".img1").setAttribute("src", getImageSrc(player1));
    document.querySelector(".img2").setAttribute("src", getImageSrc(player2));
    changeTitle(player1, player2);
}

function changeTitle(player1, player2) {
    if(player1 > player2) {
        document.querySelector("h1").textContent ="🚩 Player 1 Wins";
    } else if(player1 < player2) {
        document.querySelector("h1").textContent = "Player 2 Wins 🚩";
    } else {
        document.querySelector("h1").textContent ="Draw";
    }
}

function getImageSrc(num) {
    var imgSrc = "";
    switch (num) {
        case 1: imgSrc = "./images/dice1.png";
            break;
        case 2: imgSrc = "./images/dice2.png";
            break;
        case 3: imgSrc = "./images/dice3.png";
            break;
        case 4: imgSrc = "./images/dice4.png";
            break;
        case 5: imgSrc = "./images/dice5.png";
            break;
        case 6: imgSrc = "./images/dice6.png";
            break;
    }
   return imgSrc;

   
}

rollDice();