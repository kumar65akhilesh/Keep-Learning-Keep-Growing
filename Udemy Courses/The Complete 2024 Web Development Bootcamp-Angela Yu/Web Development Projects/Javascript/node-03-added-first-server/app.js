const  express =  require("express");
const bodyParser = require("body-parser"); 

const locationRoutes = require("./routes/location");





const app = express();

// app.set("view engine", "ejs");
// app.set("views", "views");

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", '*');
  res.setHeader("Access-Control-Allow-Methods", 'POST, GET, OPTIONS');
  res.setHeader("Access-Control-Allow-Headers", 'Content-Type');
  next();
})
app.use(locationRoutes);

//app.use(bodyParser.urlencoded( {extended: false}));

// app.use((req, res, next) => {
//   res.setHeader("Content-Type", "text/html");
//   console.log("here");
//   next();
// });

// app.use( (req, res, next) => {
//   const username = req.body.username || "Unknown User";
//   res.render("index", {
//     user:username
//   });
// });

app.listen(3000);