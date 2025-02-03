import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const API_URL = "https://secrets-api.appbrewery.com/";

//TODO 1: Fill in your values for the 3 types of auth.
const yourUsername = "akhi";
const yourPassword = "akhi";
const yourAPIKey = "91c65b8a-e415-48b7-9b98-80fc6cc8ac7f";
const yourBearerToken = "4abee25d-bbed-4991-a6c6-0557bd678120";

app.get("/", (req, res) => {
  res.render("index.ejs", { content: "API Response." });
});

app.get("/noAuth", async (req, res) => {
  //TODO 2: Use axios to hit up the /random endpoint
  //The data you get back should be sent to the ejs file as "content"
  //Hint: make sure you use JSON.stringify to turn the JS object from axios into a string.
  try {
  const resp = await axios.get("https://secrets-api.appbrewery.com/random");
  //console.log(resp.data);
  const temp =JSON.stringify(resp.data);
  //const objectVal = JSON.parse(temp);
  res.render("index.ejs", { content: temp});
  } catch(error) {
    res.render("index.ejs", { content: error.message });
  }
});

app.get("/basicAuth", async (req, res) => {
  try {
  const url = "https://secrets-api.appbrewery.com/all?page=2";
  const resp =  
  await axios.get(url, {
    auth: {
      username: yourUsername,
      password: yourPassword
    }
  });
  const temp =JSON.stringify(resp.data);
  //const objectVal = JSON.parse(temp);
  res.render("index.ejs", { content: temp });
} catch(error) {
  console.log(error.message);
  res.render("index.ejs", { content: error.message });
}
  //TODO 3: Write your code here to hit up the /all endpoint
  //Specify that you only want the secrets from page 2
  //HINT: This is how you can use axios to do basic auth:
  // https://stackoverflow.com/a/74632908
  /*
   axios.get(URL, {
      auth: {
        username: "abc",
        password: "123",
      },
    });
  */
});

app.get("/apiKey",async (req, res) => {
  
  try {
    const resp = await axios.get("https://secrets-api.appbrewery.com/filter", {
      params: { 
        score: 5, 
        apiKey: yourAPIKey 
      },
    });
    //console.log(resp.data);
    const temp =JSON.stringify(resp.data);
    //const objectVal = JSON.parse(temp);
    res.render("index.ejs", { content: temp});
    } catch(error) {
      res.render("index.ejs", { content: error.message });
    }
  //TODO 4: Write your code here to hit up the /filter endpoint
  //Filter for all secrets with an embarassment score of 5 or greater
  //HINT: You need to provide a query parameter of apiKey in the request.
});

app.get("/bearerToken",async (req, res) => {
  try {
    const resp = await axios.get("https://secrets-api.appbrewery.com/secrets/2", 
      {
        headers: { Authorization: `Bearer ${yourBearerToken}` }
    },
    );
    //console.log(resp.data);
    const temp =JSON.stringify(resp.data);
    //const objectVal = JSON.parse(temp);
    res.render("index.ejs", { content: temp});
    } catch(error) {
      res.render("index.ejs", { content: error.message });
    }
  //TODO 5: Write your code here to hit up the /secrets/{id} endpoint
  //and get the secret with id of 42
  //HINT: This is how you can use axios to do bearer token auth:
  // https://stackoverflow.com/a/52645402
  /*
  axios.get(URL, {
    headers: { 
      Authorization: `Bearer <YOUR TOKEN HERE>` 
    },
  });
  */
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
