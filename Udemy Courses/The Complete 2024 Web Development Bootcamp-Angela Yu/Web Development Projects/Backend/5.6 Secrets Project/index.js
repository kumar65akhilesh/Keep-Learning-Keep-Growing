// HINTS:
// 1. Import express and axios
import axios from "axios";
import express from "express";

// 2. Create an express app and set the port number.

const app = express();
const port = 3000;
const data = {secret:"",user:""};
// 3. Use the public folder for static files.
app.use(express.static("public"));

// 4. When the user goes to the home page it should render the index.ejs file.
app.get('/', async (req, res) => {
    try{
        const resp = await axios.get("https://secrets-api.appbrewery.com/random");    
        const dat = JSON.stringify(resp.data);
        console.log(dat);
        res.render("index.ejs", resp.data);
    }catch(error) {
        res.render("index.ejs", {secret:error.message, username:"Error"});
    }
  });
// 5. Use axios to get a random secret and pass it to index.ejs to display the
// secret and the username of the secret.


// 6. Listen on your predefined port and start the server.


app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});