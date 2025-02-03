//To see how the final website should work, run "node solution.js".
//Make sure you have installed all the dependencies with "npm i".
//The password is ILoveProgramming
import express from "express";
import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from "body-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;
const app = express();
var isUserAuthorized = false;

app.use(bodyParser.urlencoded({extended:true}));
app.use(userAuthorized);

function userAuthorized(req, res, next) {
    console.log(req.body);
    var currPass = req.body["password"];
    if(currPass === "ILoveProgramming") {
        isUserAuthorized=true;
    } else {
        isUserAuthorized=false;
    }
    next();
}

app.get("/",(req, res) => {
    res.sendFile(__dirname+"/public/index.html");
    console.log("server ");
}
);

app.post("/check", (req, res) => {
    console.log(req.body);
    var pass = req.body["password"];
    if(isUserAuthorized) {
        res.sendFile(__dirname+"/public/secret.html");
    } else {
        res.redirect("/");
    }
});

app.listen(port, ()=>{
    console.log(`Server listening at port ${port}`);
});