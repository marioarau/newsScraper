/* global bootbox */
$(document).ready(function () {
  // Setting a reference to the article-container div where all the dynamic content will go
  // Adding event listeners to any dynamically generated "save article"
  // and "scrape new article" buttons
  var articleContainer = $(".article-container");
  $(document).on("click", ".btn.save", handleArticleSave);
  //$(document).on("click", ".scrape-new", handleArticleScrape);
  $(".clear").on("click", handleArticleClear);

  function initPage() {
    // Run an AJAX request for any unsaved headlines
    $.get("/headlines").then(function (data) {
      articleContainer.empty();
      // If we have headlines, render them to the page
      if (data && data.length) {
        renderArticles(data);
      } else {
        // Otherwise render a message explaining we have no articles
        renderEmpty();
      }
    });
  }

  function handleArticleClear() {
    $.get("/articles/delete").then(function () {
      $(".article-container").empty();
      initPage();
    });
  }

  function handleArticleSave() {

    console.log("entering handlArticleSave");
    // This function is triggered when the user wants to save an article
    // When we rendered the article initially, we attached a javascript object containing the headline id
    // to the element using the .data method. Here we retrieve that.
    var articleToSave = $(this)
      .parents(".card")
      .data();

    // Remove card from page
    $(this)
      .parents(".card")
      .remove();

    console.log("removed article from page");
    //articleToSave.saved = true;
    // Using a patch method to be semantic since this is an update to an existing record in our collection
    console.log("making AJAX call to save article from page");
    console.log("articleToSave: ", articleToSave);
    id = articleToSave._id;
    console.log("id: ", id);

    userData = {"id" : id}
    currentURL ="";
    $.post(currentURL + "/save-article", userData, function (data) {
      if (data.saved) {
        // Run the initPage function again. This will reload the entire list of articles
        initPage();
      }
    });
  }

  // Whenever someone clicks a p tag
  $(document).on("click", "p", function () {
    // Empty the notes from the note section
    $("#notes").empty();
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");

    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/articles/" + thisId
    })
      // With that done, add the note information to the page
      .then(function (data) {
        console.log(data);
        // The title of the article
        $("#notes").append("<h2>" + data.title + "</h2>");
        // An input to enter a new title
        $("#notes").append("<input id='titleinput' name='title' >");
        // A textarea to add a new note body
        $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

        // If there's a note in the article
        if (data.note) {
          // Place the title of the note in the title input
          $("#titleinput").val(data.note.title);
          // Place the body of the note in the body textarea
          $("#bodyinput").val(data.note.body);
        }
      });
  });

  // When you click the savenote button
  $(document).on("click", "#savenote", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/articles/" + thisId,
      data: {
        // Value taken from title input
        title: $("#titleinput").val(),
        // Value taken from note textarea
        body: $("#bodyinput").val()
      }
    })
      // With that done
      .then(function (data) {
        // Log the response
        console.log(data);
        // Empty the notes section
        $("#notes").empty();
      });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });
});