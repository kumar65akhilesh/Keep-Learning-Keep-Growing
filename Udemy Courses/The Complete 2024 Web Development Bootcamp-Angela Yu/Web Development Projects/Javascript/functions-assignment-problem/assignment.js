
const sayHello1 = name => console.log('Hi ' + name);


const sayHello2 = (greet ="Hi", name="Stranger") => {
  console.log(`${greet} ${name}`);
}

const sayHello3 = () =>  "Hi Max";

function checkInput(cb, ...strs) {
  let isNotEmpty = strs.length > 0;
  for(const str of strs) {
    if(!str) {
      isNotEmpty = false;
    }
  }
  if(isNotEmpty) {
    cb();
  }

}
function cb() {
  console.log("Call back initiated");
}

sayHello1("Akhilesh");
sayHello2(undefined, undefined);
console.log(sayHello3());
checkInput(cb,"ss","","s");