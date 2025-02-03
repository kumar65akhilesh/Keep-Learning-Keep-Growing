import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 

const app = express();
const port = 3000;
var bandName = "";

app.use(bodyParser.urlencoded({extended:true}));

app.use(bandNameGenerator);

function bandNameGenerator(req, res, next){
  console.log(req.body);
  bandName = req.body["street"]+req.body["pet"];
  next();
}

app.get("/",(req, res)=>{
  res.sendFile(__dirname+ "/public/index.html");
  
});

app.post("/submit", (req, res) => {
  //console.log(req.body.street);
  res.send(`<h1>Your Band Name is</h1><h2>${bandName}</h2>`);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
