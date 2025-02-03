import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const port = 3000;
const app = express();
const clientToken = "openuv-22rwrluysbxxf-io";
const API_URL = "https://api.openuv.io/api/v1/forecast";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    //Step 1 - Make the get route work and render the index.ejs file.
    try {
        

        let data = {
            params: {
                lat: "28.8558134",
                lng: "-81.3365537",
                dt: new Date()
            },
            headers: {
                "x-access-token": clientToken,
                "content-type": "application/json"
            },
            redirect: "follow"
        };
       
        const url = `${API_URL}`;
        console.log(url);
        const serverResponse = await axios.get(url, data);
        
        //console.log(JSON.stringify(serverResponse.data));
        res.render("index.ejs", {uvdata : serverResponse.data } );
    }catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching data" });
    }
    
    });

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
  
