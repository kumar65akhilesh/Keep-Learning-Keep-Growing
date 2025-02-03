console.log(document.cookie);

const btns = document.querySelectorAll("button");

const userId = "u123";
btns[0].addEventListener("click",()=>{
    const userId = "u123";
    document.cookie = `uid=${userId}`;
    document.cookie = `sid=${userId}`;
});
btns[1].addEventListener("click",()=>{
    console.log(document.cookie);
});