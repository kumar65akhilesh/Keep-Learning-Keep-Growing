import express from "express";
import bodyParser from "body-parser";

var cnt = 0;
const port = 3000;
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const postData = new Map();

var postFormat = `<div id="div1" class="posts">
<div class="mb-3">
  <label for="tarea1" class="form-label" id="label1">ReplaceTimeStamp</label>
  <textarea class="form-control" id="tarea1" name="tarea1" rows="3"></textarea>
</div>
<div class="d-grid gap-2 d-sm-flex justify-content-sm-end">
  <button class="btn btn-primary" id="sav1" value="1" name="save" type="submit">Save</button>
  <button type="button" id="del1" value="1" name="del" class="btn btn-danger" >Delete</button>
</div>
</div>`;

var htmlContent = '';
var displayData = "dbData";
app.get("/", (req, res) => {
  //Step 1 - Make the get route work and render the index.ejs file.
  res.render("index.ejs");
});
app.post("/submit", (req, res) =>{
  postData.set(cnt, {"dateVal":new Date(), 
    "postContent":req.body["createPost"]});
  //console.log(postData);
  cnt++;
  res.render("index.ejs", {"dbData": postData});  
});

app.post("/save", (req, res) => {
  var deleteContent = req.body.del != undefined ? true : false;
  if(deleteContent) {
    let key = parseInt(req.body.del);
    postData.delete(key);
  } else{
    let key = parseInt(req.body.save);
    postData.get(key)["postContent"] = req.body['tarea'+key]; 
  }  
  res.render("index.ejs", {"dbData": postData});
});

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});





