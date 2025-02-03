const button = document.querySelector("button");
const buttonClickHandler = (e) => {
    console.log(e);
}
const anotherbuttonClickHandler = () => {
    console.log('button another clicked');
}
const boundObj = buttonClickHandler.bind(this);

button.addEventListener("click", buttonClickHandler);
setTimeout(()=> {
    button.removeEventListener("click", buttonClickHandler);
},3000)
//button.removeEventListener("click", buttonClickHandler);


const div = document.querySelector("div");
button.addEventListener("click", event => {
    event.stopPropagation();
    console.log("btn clicke")
    console.log(event);
});

//const div = document.querySelector("div");
div.addEventListener("click", event => {
    console.log("div clicked")
    console.log(event);
});
const listItems=document.querySelector("ul");
listItems.addEventListener("click", (event) => {
    event.target.closest("li").classList.toggle("clickedList");
});



