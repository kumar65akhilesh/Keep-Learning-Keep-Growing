const express = require("express");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const router = express.Router();

const uri = "mongodb+srv://kumar:Cappuccino1!@cluster0.l4ocsw8.mongodb.net/locations?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const locationStroage = {
  location: [],
};

router.post("/add-location", async (req, res, next) => {
    
        try {
          // Connect to the "insertDB" database and access its "haiku" collection
          const database = client.db("locations");
          const haiku = database.collection("user-locations");
          
          // Create a document to insert
          const doc = {
            
            address: req.body.address,
            coords: {
              lat: req.body.lat,
              lng: req.body.lng,
            },
          }
          // Insert the defined document into the "haiku" collection
          console.log("I am here");
          const result = await haiku.insertOne(doc);
          console.log("I am here");
          // Print the ID of the inserted document
          console.log(result);
          console.log("I am here");
          res.json({ message: "Stored loaction!", locId: result.insertedId});
          console.log(`A document was inserted with the _id: ${result.insertedId}`);
        } catch(err) { 
            console.log(err);
        }finally {
           // Close the MongoDB client connection
          //await client.close();
        }
      
      // Run the function and handle any errors
      //run().catch(console.dir);
  //const id = Math.random();
//   locationStroage.location.push({
//     id: id,
//     address: req.body.address,
//     coords: {
//       lat: req.body.lat,
//       lng: req.body.lng,
//     },
//   });
  
});

router.get("/location/:lid", async (req, res, next) => {
    const locationId = req.params.lid;
    try {
    
        // Get the database and collection on which to run the operation
        const database = client.db("locations");
        const haiku = database.collection("user-locations");
        // Query for a movie that has the title 'The Room'
        const query = { _id:  new mongodb.ObjectId(locationId) };
        // const options = {
        //   // Sort matched documents in descending order by rating
        //   sort: { "imdb.rating": -1 },
        //   // Include only the `title` and `imdb` fields in the returned document
        //   projection: { _id: 0, title: 1, imdb: 1 },
        // };
        // Execute query
        const location = await haiku.findOne(query, {});
        // Print the document returned by findOne()
        return res.json({
            address: location.address,
            coordinates: location.coords
        });
        console.log(location);
      } finally {
       // await client.close();
      }
    
    // if(!location) {
    //     return res.status(403).json({message: "Not found!"});
    // }
    // return res.json({
    //     address: location.address,
    //     coordinates: location.coords
    // });
});

module.exports = router;
