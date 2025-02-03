var buttonColors = ["red", "blue", "green", "yellow"];
var gamePattern = [];
var userClickedPattern = [];
var totalClicks = 0;
var level = 0;
var buttonsClicked = 0;
function newSequence() {
  $("h1").html("Level " + level);
  var randomNumber = Math.floor(Math.random() * 4);
  var randomChosenColor = buttonColors[randomNumber];
  gamePattern.push(randomChosenColor);
  $("." + randomChosenColor)
    .fadeOut(100)
    .fadeIn(100);
  playSound(randomChosenColor);
  level++;
}

$(".btn").on("click", handleClick);
function handleClick(evt) {
  //evt.target.classList.cotains()
  //console.log(this.id);
  //var userChosenColor = evt.target.id;
  buttonsClicked++;
  var userChosenColor = this.id;
  userClickedPattern.push(userChosenColor);
  playSound(userChosenColor);
  if (buttonsClicked === level) {
    if (!checkAnswer()) {
      $("body").addClass("game-over");
      setTimeout(removeclass, 200);
      playSound("wrong");
      $("h1").html("Game over, Press any Key to Resstarttart");
      level = 0;
    } else {
        newSequence();
    }
    userClickedPattern = [];
    buttonsClicked = 0;
  } 
}

function removeclass() {
    $("body").removeClass("game-over");
}

function reset() {
    level = 0;
    buttonsClicked = 0;
}

function playSound(filaname) {
  var audio = new Audio("./sounds/" + filaname + ".mp3");
  audio.addEventListener("canplaythrough", (e) => audio.play());
}

function animateColor(color) {
  $(".red").addClass("pressed");
  setTimeout(function () {
    $(".red").removeClass("pressed");
  }, 100);
}
$(document).on("keyup", function () {
    
    userClickedPattern = [];
    gamePattern = [];
    reset();
    newSequence();

});

function checkAnswer() {
  if (gamePattern.toString() === userClickedPattern.toString()) {
    return true;
  }
  
  return false;
}
