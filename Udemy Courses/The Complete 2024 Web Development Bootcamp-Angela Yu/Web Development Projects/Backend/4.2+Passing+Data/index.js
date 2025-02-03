import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
var heading = "";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(validateName);

function validateName(req, res, next) {
  console.log(req.body["fName"]);
  if(req.body["fName"] != undefined && req.body["lName"] != undefined) {
    if (req.body["fName"].length + req.body["lName"].length > 0) {
      heading =
        "You have " +
        (req.body["fName"].length + req.body["lName"].length) +
        " letters in your name";
    } else {
      heading = "Please Enter your name below 👇!";
    }
  } else {
    heading = "Please Enter your name below 👇!";
  }
  data["header"] = heading;
  console.log(heading);
  next();
}
var data = {
  header: heading
};

app.get("/", (req, res) => {
  res.render("index.ejs", data);
});

app.post("/submit", (req, res) => {
  console.log(req.body["fName"].length + " && " + req.body["lName"].length);
  res.render("index.ejs", data);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
