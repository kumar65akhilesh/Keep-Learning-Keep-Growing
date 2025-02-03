import express from "express";
import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const port = 3000;
const app = express();

app.get("/", (req, res) => {
    
    var day = new Date();
    console.log(day);
    var dayNum = day.getDay();
    var greet = "It's weekday, time to work hard!";
    if(dayNum === 0 || dayNum === 6) {
        greet = "It's weekend, time to have fun!";
    } 
    res.render("index.ejs", {"greeting":greet});
});
app.listen(port, () => {
    console.log(`Server listneing at port ${port}`);
})