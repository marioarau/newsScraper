/* global bootbox */
$(document).ready(function () {
  // Setting a reference to the article-container div where all the dynamic content will go
  // Adding event listeners to any dynamically generated "save article"
  // and "scrape new article" buttons
  var articleContainer = $(".article-container");
  $(document).on("click", ".btn.save", handleArticleSave);
  $(document).on("click", ".btn.notes", handleOpenArticleNote);
  $(document).on("click", "#saveModal", handleSaveNote);
  $(document).on("click", ".btn.delete", handleDeleteSavedArticle);

  //$(document).on("click", ".scrape-new", handleArticleScrape);
  $(".scrape").on("click", handleScrapeArticles);
  $(".clear").on("click", handleDeleteScrapedArticles);

  function handleScrapeArticles() {
    var currentArticle = $(this)
      .parents(".card")
      .data();
    $.get("/scrape").then(function () {
      //initPage();
      console.log("Scraped articles from remote site");
    });
  }

  function handleDeleteScrapedArticles() {
    var currentArticle = $(this)
      .parents(".card")
      .data();
    $.get("/article-delete").then(function () {
      $(".article-container").empty();
      initPage();
    });
  }

  function handleDeleteSavedArticle() {
    var articleToDelete = $(this)
    .parents(".card")
    .data();

  // Remove card from page
  $(this)
    .parents(".card")
    .remove();
    console.log("currentArticle: ", articleToDelete);
    console.log("entering handleDeleteSavedArticle", articleToDelete._id);
    $.get("/delete-saved-article/" + articleToDelete._id).then(function () {
      initPage();
    });
  }

  function handleSaveNote() {

    //noteText
    var _id = $("#noteText").attr("data-id");
    var link = $("#noteText").val();
    var title = $("#modalArticleTitle").val();
    var note = $("#noteText").val();

    // Now make an ajax call for the Article

    $.ajax({
      method: "POST",
      url: "/article-note",
      data: {
        "_id": _id,
        "title": title,
        "link": link,
        "note": note
      }
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
  };




  function initPage() {
    // Run an AJAX request for any unsaved headlines
    $.get("/headlines").then(function (data) {
      articleContainer.empty();
      // If we have headlines, render them to the page
      if (data && data.length) {
        renderArticles(data);
      }
      else {
        // Otherwise render a message explaining we have no articles
        renderEmpty();
      }
    });
  }

  function handleOpenArticleNote(event) {
    // This function handles opening the notes modal and displaying our notes
    // We grab the id of the article to get notes for from the card element the delete button sits inside
    var currentArticle = $(this)
      .parents(".card")
      .data();
    console.log("entering handleArticleNotes", currentArticle._id);
    // Grab any notes with this headline/article id
    $.get("articles/" + currentArticle._id).then(function (data) {
      // Constructing our initial HTML to add to the notes modal
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );
      console.log("data: ", data);
      console.log("loading boot box modal");
      // Adding the formatted HTML to the note modal
      // Show the modal with the best match

      console.log("data.title: ", data.title);
      $("#modalArticleTitle").html(data.title);
      $("#modalArticleTitle").attr("data-id", data._id);
      $("#notesModal").modal('toggle');

      // Adding some information about the article and article notes to 
      // the save button for easy access When trying to add a new note
      //$(".btn.save").data("article", noteData);
      // renderNotesList will populate the actual note HTML inside of 
      // the modal we just created/opened
      //console.log("calling renderNotesList");
      //renderNotesList(noteData);
    });
  }

  function renderNotesList(data) {
    // This function handles rendering note list items to our notes modal
    // Setting up an array of notes to render after finished
    // Also setting up a currentNote variable to temporarily store each note
    console.log("entering renderNotesList")
    var notesToRender = [];
    var currentNote;
    if (!data.notes.length) {
      // If we have no notes, just display a message explaining this
      currentNote = $("<li class='list-group-item'>No notes for this article yet.</li>");
      notesToRender.push(currentNote);
    } else {
      // If we do have notes, go through each one
      for (var i = 0; i < data.notes.length; i++) {
        // Constructs an li element to contain our noteText and a delete button
        currentNote = $("<li class='list-group-item note'>")
          .text(data.notes[i].noteText)
          .append($("<button class='btn btn-danger note-delete'>x</button>"));
        // Store the note id on the delete button for easy access when trying to delete
        currentNote.children("button").data("_id", data.notes[i]._id);
        // Adding our currentNote to the notesToRender array
        notesToRender.push(currentNote);
      }
    }
    // Now append the notesToRender to the note-container inside the note modal
    $(".note-container").append(notesToRender);
  }

  function handleArticleDelete() {
    // This function handles deleting articles/headlines
    // We grab the id of the article to delete from the card element the delete button sits inside
    var articleToDelete = $(this)
      .parents(".card")
      .data();

    // Remove card from page
    $(this)
      .parents(".card")
      .remove();
    // Using a delete method here just to be semantic since we are deleting an article/headline
    $.ajax({
      method: "DELETE",
      url: "/api/headlines/" + articleToDelete._id
    }).then(function (data) {
      // If this works out, run initPage again which will re-render our list of saved articles
      if (data.ok) {
        initPage();
      }
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

    userData = { "id": id }
    currentURL = "";
    $.post(currentURL + "/save-article", userData, function (data) {
      if (data.saved) {
        // Run the initPage function again. This will reload the entire list of articles
        initPage();
      }
    });
  }

  // Whenever someone clicks a p tag

  function handleArticleNotes(event) {
    // This function handles opening the notes modal and displaying our notes
    // We grab the id of the article to get notes for from the card element the delete button sits inside
    var currentArticle = $(this)
      .parents(".card")
      .data();
    // Grab any notes with this headline/article id
    $.get("/api/notes/" + currentArticle._id).then(function (data) {
      // Constructing our initial HTML to add to the notes modal
      var modalText = $("<div class='container-fluid text-center'>").append(
        $("<h4>").text("Notes For Article: " + currentArticle._id),
        $("<hr>"),
        $("<ul class='list-group note-container'>"),
        $("<textarea placeholder='New Note' rows='4' cols='60'>"),
        $("<button class='btn btn-success save'>Save Note</button>")
      );
      // Adding the formatted HTML to the note modal
      bootbox.dialog({
        message: modalText,
        closeButton: true
      });
      var noteData = {
        _id: currentArticle._id,
        notes: data || []
      };
      // Adding some information about the article and article notes to the save button for easy access
      // When trying to add a new note
      $(".btn.save").data("article", noteData);
      // renderNotesList will populate the actual note HTML inside of the modal we just created/opened
      renderNotesList(noteData);
    });
  }

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