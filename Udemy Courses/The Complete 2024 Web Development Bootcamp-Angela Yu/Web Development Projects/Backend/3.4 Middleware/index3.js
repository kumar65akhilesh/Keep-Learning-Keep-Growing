import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));

function logger(req, res, next) {
  //console.log(req.url);
  //console.log(req.method);
  console.log(res.statusCode);
  
  next();
}


app.use(logger);



app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
