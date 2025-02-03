const fs=require("fs");
fs.writeFile("temp.txt", "hello", handlerror);
function handlerror(err) {
    if(err)
    throw err;
    console.log("file saved!");
}

fs.readFile('message.txt', "utf-8",(err, data) => {
    if (err) throw err;
    console.log(data);
  }); 