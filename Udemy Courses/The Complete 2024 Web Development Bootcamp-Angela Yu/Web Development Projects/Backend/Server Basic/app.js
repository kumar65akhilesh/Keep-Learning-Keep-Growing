import express from "express";
const port = 3000;

const app = express();

app.listen(port, () => {
    console.log("Server started. Cheers!");
});

app.get("/", (req, res) => {
   // res.send("<h1>Hello Akhilesh</h1>");
   res.send("<h2>Hello World!</h2>");
   //console.log(req.rawHeaders);
});

app.get("/about", (req, res) => {
    // res.send("<h1>Hello Akhilesh</h1>");
    res.send("<h2>About Me!</h2><p>My name is Akhilesh</p>");
    //console.log(req.rawHeaders);
 });

 app.get("/contact", (req, res) => {
    // res.send("<h1>Hello Akhilesh</h1>");
    res.send("<h2>Contact Me!</h2><p>Phone Num: 3529733359</p>");
    //console.log(req.rawHeaders);
 });

 app.post("/register", (req, res) => {
    res.sendStatus(201);
 });

 app.put("/user/akhilesh", (req, res) =>{
    res.sendStatus(200);
 });

 app.patch("/user/akhilesh", (req, res) => {
    res.sendStatus(200);
 });