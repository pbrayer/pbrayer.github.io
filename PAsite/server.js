// *****************************************************************************
// Server.js - This file is the initial starting point for the Node/Express server.
//
// ******************************************************************************
// *** Dependencies
// =============================================================
const express = require("express");



// Sets up the Express App
// =============================================================
const app = express();
const PORT = process.env.PORT || 8080;


// Static directory
app.use(express.static("public"));

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Routes
// =============================================================
require("./routes/routes")(app);
  
app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});