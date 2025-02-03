const startGameBtn = document.getElementById("start-game-btn");
const ROCK = "ROCK";
const PAPER = "PAPER";
const RESULT_DRAW = "DRAW";
const RESULT_PLAYER_WINS = "PLAYER WINS";
const RESULT_COMPUTER_WIN = "COMPUTER WINS";

const SCISSORS = "SCISSORS";
let isGameRunnig = false;
function startGame() {
  if (isGameRunnig) {
    return;
  }
  isGameRunnig = true;
  console.log("Game starting...");

  const playerSelection = getPlayerChoice();
  const computerChoice = getComputerChoice();
  const winner = getWinner(computerChoice, playerSelection);
  console.log(winner);
  //console.log(playerSelection);
}

const getWinner = function (cChoice, pChoice) {
  if (cChoice === pChoice) {
    return RESULT_DRAW;
  } else if (
    (cChoice === ROCK && pChoice === PAPER) ||
    (cChoice === PAPER && pChoice === SCISSORS) ||
    (cChoice === SCISSORS && pChoice === ROCK)
  ) {
    return RESULT_PLAYER_WINS;
  } else {
    return RESULT_COMPUTER_WIN;
  }
};

const getComputerChoice = function () {
  const rand = Math.random();
  let choice = "";
  if (rand < 0.33) {
    choice = ROCK;
  } else if (rand < 0.67) {
    choice = PAPER;
  } else {
    choice = SCISSORS;
  }
  return choice;
};
const getPlayerChoice = function () {
  const selection = prompt("Rock, Paper or Scissors?", "").toUpperCase();
  if (selection !== ROCK && selection !== PAPER && selection !== SCISSORS) {
    alert("Invalid selection. CHOSE ROCK FOR YOU");
    return ROCK;
  }
  return selection;
};
//console.dir(startGame);

startGameBtn.addEventListener("click", startGame);
