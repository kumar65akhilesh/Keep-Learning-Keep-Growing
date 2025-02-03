const defaultResult = 0;
let currentResult = defaultResult;

function add() {
  currentResult = currentResult + parseInt(userInput.value);
  outputResult(currentResult, '');
}

addBtn.addEventListener('click', add);
function double(num){
 return num*2;
}
function transform(num, double) {
  return double(num);
}
