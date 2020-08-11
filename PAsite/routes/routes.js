// Requiring path to so we can use relative routes to our HTML files
var path = require("path");

module.exports = function(app) {

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  app.get('/about', (req, res) => {  
    res.sendFile(path.join(__dirname, "../public/about.html"));
  });

  app.get('/contact', (req, res) => {  
    res.sendFile(path.join(__dirname, "../public/contact.html"));
  });

  app.get('/services', (req, res) => {  
    res.sendFile(path.join(__dirname, "../public/services.html"));
  });


  // app.put("/api/tables/:id",  accessProtectionMiddleware, (req, res) => {
  //   db.foundTables.update({taken: 1}, //was 1
  //     {where: {
  //       id: req.params.id
  //     }}).then(function(results) {
  //     res.json(results);
  //   });
  // });

  // app.get("/api/tables",  accessProtectionMiddleware, (req, res) => {   
  //   db.foundTables.findAll().then(function(tableData) {
  //     res.json(tableData);
  //   });
  // });

// Serve a test API endpoint
// This is just to test your API -- we're gonna delete this endpoint later
// app.get('/test', (req, res) => {  
//     res.send('Your api is working!');
//   });

};
