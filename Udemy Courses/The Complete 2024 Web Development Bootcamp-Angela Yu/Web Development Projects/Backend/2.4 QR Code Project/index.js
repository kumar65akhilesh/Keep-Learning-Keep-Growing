/* 
1. Use the inquirer npm package to get user input.
2. Use the qr-image npm package to turn the user entered URL into a QR code image.
3. Create a txt file to save the user input using the native fs node module.
*/
import inquirer from "inquirer";
import fs from "fs";

import qr from "qr-image";



var abc = inquirer.registerPrompt("Whats the URL", "abc");
var ans;

var questions = {
    type:"input",
    name:"ans",
    message:"URL Plz",
    default:"no value entered",
    waitUserInput:true
};

inquirer.prompt(questions).then((answers) => {
    console.log(answers.ans);
    var qr_svg = qr.image(answers.ans, { type: 'png' });
    qr_svg.pipe(fs.createWriteStream('qr_image.png'));
 
    
    fs.writeFile("./URL.txt","\n"+answers.ans,{flag:"a"},(err)=>{
        if(err)
            console.log(err);
        console.log("saved url");

    });
   // console.log(JSON.stringify(answers, null, '  '));
  });

  //console.log("value is "+answers.ans);
 /*

*/