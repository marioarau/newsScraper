var path = require("path");
var express = require("express");
var bodyParser = require("body-parser");
var exphbs = require('express-handlebars');
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Set Handlebars.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static(path.join(__dirname, '/public')))
app.get('/', function (req, res) {
  res.render('index');
});


// Parse request body as JSON
//app.use(express.urlencoded({ extended: true }));
//app.use(express.json());
// Make public a static folder
//app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsScraper", { useNewUrlParser: true });

// Routes

// Route for saving an Article
app.post('/save/article', function (req, res) {
  console.log(req.body);
  return false;
  //console.log(JSON.stringify(req.body));
  var id = req.body.id;
  console.log("Entering route for /save/article/"+id);
  db.ArticleTemp.findOne({ _id: id }, function (req, res) {
    var result = {};
    result.title = req.param.title;
    result.link = req.param.link;
    db.Article.create(result)
      .then(function (dbArticle) {
        // View the added result in the console
        console.log("inserted article into db: ", dbArticle);
        db.ArticleTemp.deleteOne({ _id: id });
        console.log("deleted article from ArticleTemp collection");
      })
      .catch(function (err) {
        // If an error occurred, log it
        console.log("article create: ", err);
      });
  });
});

// Route for deleting all Articles from the from the Articles Collection
app.get("/articles/delete", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.remove({})
    .then(function () {
      console.log("Articles Deleted. Calling render index")
      // If we were able to successfully find Articles, send them back to the client
      res.render('index', {
        articlesDeleted: true
      });
    }).catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with axios
  //axios.get("http://www.echojs.com/").then(function(response) {
  axios.get("https://www.jornada.com.mx/ultimas/mundo/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".ljn-title-listado").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.ArticleTemp.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log("inserting into Temp db: ", dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log("articleTemp create: ", err);
        });
    });

    // Send a message to the client
    //res.send("Scrape Complete");
    db.ArticleTemp.find()
      .then(function (dbArticles) {
        console.log("read db rendering index page: ", dbArticles);

        // If we were able to successfully find Articles, send them back to the client
        res.render('index', {
          scrapeComplete: true,
          dbArticles: dbArticles
        });
        //res.json(dbArticle);
      }).catch(function (err) {
        // If an error occurred, send it to the client
        res.json("error rendering the page: ", JSON.stringify(err));
      });

  }).catch(function (err) {
    // If an error occurred, send it to the client
    // console.log("scrape error", JSON.stringify(err));
    console.log("scrape error: ", err);
    res.send(err);
  });
});

// Route for getting all Articles from the db
app.get("/headlines", function (req, res) {
  // Grab every document in the Articles collection
  db.ArticleTemp.find()
    .then(function (dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      res.render('index', {
        scrapeComplete: true,
        dbArticles: dbArticles
      });
      //res.json(dbArticle);
    }).catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/viewscraped", function (req, res) {
  // Grab every document in the Articles collection
  db.ArticleTemp.find()
    .then(function (dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      res.render('index', {
        dbArticles: dbArticles
      });
      //res.json(dbArticle);
    }).catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/saved", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find()
    .then(function (dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      res.render('saved', {
        savedArticles: true,
        dbArticles: dbArticles
      });
      //res.json(dbArticle);
    }).catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
