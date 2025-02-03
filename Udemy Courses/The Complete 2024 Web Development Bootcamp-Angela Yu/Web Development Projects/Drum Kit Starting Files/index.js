var allDrums = document.querySelectorAll(".drum");
for (var i = 0; i < allDrums.length; i++) {
  allDrums[i].addEventListener("click", handleClick);
}
function handleClick() {
  var path = "";
  path = returnPath(this.textContent);
  var audio = new Audio(path);
  //audio.play();
  audio.addEventListener("canplaythrough", (event) => {
    audio.play();
  });
  buttonAnimation(this.textContent);
  // alert(document.createElement("audio").duration);
}
document.addEventListener("keydown", function (e) {
  path = "";
  path = returnPath(e.key);

  var audio = new Audio(path);
  //audio.play();
  audio.addEventListener("canplaythrough", (event) => {
    audio.play();
  });
  buttonAnimation(e.key);
});

function returnPath(ch) {
  var path = "";
  switch (ch) {
    case "W":
    case "w":
      path = "./sounds/tom-1.mp3";
      break;
    case "A":
    case "a":
      path = "./sounds/tom-2.mp3";
      break;
    case "S":
    case "s":
      path = "./sounds/tom-3.mp3";
      break;
    case "D":
    case "d":
      path = "./sounds/tom-4.mp3";
      break;
    case "J":
    case "j":
      path = "./sounds/snare.mp3";
      break;
    case "K":
    case "k":
      path = "./sounds/crash.mp3";
      break;
    case "L":
    case "l":
      path = "./sounds/kick-bass.mp3";
      break;
    default:
      console.log("button text content: " + ch);
  }
  return path;
}

function buttonAnimation(currentKey) {
    var elem = document.querySelector("."+currentKey);
    elem.classList.add("pressed");
    setTimeout(function() {
        elem.classList.remove("pressed");
    }, 100);
   
}
