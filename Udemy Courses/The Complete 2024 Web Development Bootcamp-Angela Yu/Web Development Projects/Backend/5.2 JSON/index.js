import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

//Step 1: Run the solution.js file without looking at the code.
//Step 2: You can go to the recipe.json file to see the full structure of the recipeJSON below.
const recipeJSON =
  '[{"id": "0001","type": "taco","name": "Chicken Taco","price": 2.99,"ingredients": {"protein": {"name": "Chicken","preparation": "Grilled"},  "salsa": {"name": "Tomato Salsa","spiciness": "Medium"},  "toppings": [{"name": "Lettuce",  "quantity": "1 cup",  "ingredients": ["Iceberg Lettuce"]  },      {"name": "Cheese",  "quantity": "1/2 cup",  "ingredients": ["Cheddar Cheese", "Monterey Jack Cheese"]  },      {"name": "Guacamole",  "quantity": "2 tablespoons",  "ingredients": ["Avocado", "Lime Juice", "Salt", "Onion", "Cilantro"]  },      {"name": "Sour Cream",  "quantity": "2 tablespoons",  "ingredients": ["Sour Cream"]  }      ]    }  },{"id": "0002","type": "taco","name": "Beef Taco","price": 3.49,"ingredients": {"protein": {"name": "Beef","preparation": "Seasoned and Grilled"},  "salsa": {"name": "Salsa Verde","spiciness": "Hot"},  "toppings": [{"name": "Onions",  "quantity": "1/4 cup",  "ingredients": ["White Onion", "Red Onion"]  },      {"name": "Cilantro",  "quantity": "2 tablespoons",  "ingredients": ["Fresh Cilantro"]  },      {"name": "Queso Fresco",  "quantity": "1/4 cup",  "ingredients": ["Queso Fresco"]  }      ]    }  },{"id": "0003","type": "taco","name": "Fish Taco","price": 4.99,"ingredients": {"protein": {"name": "Fish","preparation": "Battered and Fried"},  "salsa": {"name": "Chipotle Mayo","spiciness": "Mild"},  "toppings": [{"name": "Cabbage Slaw",  "quantity": "1 cup",  "ingredients": [    "Shredded Cabbage",    "Carrot",    "Mayonnaise",    "Lime Juice",    "Salt"          ]  },      {"name": "Pico de Gallo",  "quantity": "1/2 cup",  "ingredients": ["Tomato", "Onion", "Cilantro", "Lime Juice", "Salt"]  },      {"name": "Lime Crema",  "quantity": "2 tablespoons",  "ingredients": ["Sour Cream", "Lime Juice", "Salt"]  }      ]    }  }]';

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/recipe", (req, res) => {
  const buttonPressed = req.body.choice;
  const data = JSON.parse(recipeJSON);
  var dataForFrontEnd = {
    "recipe":"",
    "proteinName": "",
    "proteinPreparation": "",
    "salsaName": "",
    "toppings": []
  };
  if (buttonPressed == "chicken") {
    dataForFrontEnd.recipe = data[0].name;
    dataForFrontEnd.proteinName = data[0].ingredients.protein.name;
    dataForFrontEnd.proteinPreparation =
      data[0].ingredients.protein.preparation;
    dataForFrontEnd.salsaName = data[0].ingredients.salsa.name;
    var cnt = 0;
    data[0].ingredients.toppings.forEach(function (item) {
      // console.log(item.name);
      dataForFrontEnd.toppings[cnt++] = item.quantity + " of " + item.name;
    });
  } else if (buttonPressed == "fish") {
    dataForFrontEnd.recipe = data[0].name;
    dataForFrontEnd.proteinName = data[2].ingredients.protein.name;
    dataForFrontEnd.proteinPreparation =
      data[2].ingredients.protein.preparation;
    dataForFrontEnd.salsaName = data[2].ingredients.salsa.name;
    var cnt = 0;
    data[2].ingredients.toppings.forEach(function (item) {
      // console.log(item.name);
      dataForFrontEnd.toppings[cnt++] = item.quantity + " of " + item.name;
    });
  } else if (buttonPressed == "beef") {
    dataForFrontEnd.recipe = data[0].name;
    dataForFrontEnd.proteinName = data[1].ingredients.protein.name;
    dataForFrontEnd.proteinPreparation =
      data[1].ingredients.protein.preparation;
    dataForFrontEnd.salsaName = data[1].ingredients.salsa.name;
    var cnt = 0;
    data[1].ingredients.toppings.forEach(function (item) {
      // console.log(item.name);
      dataForFrontEnd.toppings[cnt++] = item.quantity + " of " + item.name;
    });
  }
  console.log(dataForFrontEnd);
  res.render("index.ejs", dataForFrontEnd);
  //Step 3: Write your code here to make this behave like the solution website.
  //Step 4: Add code to views/index.ejs to use the recieved recipe object.
});

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
