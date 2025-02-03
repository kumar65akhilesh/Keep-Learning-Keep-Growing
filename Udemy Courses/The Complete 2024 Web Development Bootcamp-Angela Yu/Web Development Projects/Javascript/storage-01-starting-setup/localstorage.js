const btns = document.querySelectorAll("button");

const userId = "u123";
btns[0].addEventListener("click",()=>{
    window.localStorage.setItem("uid", userId);
    window.sessionStorage.setItem("sid", userId);
});
btns[1].addEventListener("click",()=>{
    console.log("localSotage "  + window.localStorage.getItem("uid"));
    console.log("sessionSotage "  + window.sessionStorage.getItem("sid"));
});


