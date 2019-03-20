  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDh7NXLBoNf5wwQL-v5iL2qEHNVSunsAeo",
    authDomain: "birthday-tracker-d5e91.firebaseapp.com",
    databaseURL: "https://birthday-tracker-d5e91.firebaseio.com",
    projectId: "birthday-tracker-d5e91",
    storageBucket: "birthday-tracker-d5e91.appspot.com",
    messagingSenderId: "520051977263"
  };
  firebase.initializeApp(config);

  var database = firebase.database();

  

  $(document).ready(function() { //This is wrapping the changes to the table in a document ready block. This will wait until the page is done loading and then perform the changes below.
    
  database.ref().on("child_added", function(childSnapshot) {
    function populateBirthdays(){
        var row = $("<tr>") //Dynamically creating a new row
        row.attr("style", "text-align: center;")
       var giftsTd = $("<td>") //Dynamically creating a column entry
       var giftsButton = $("<button>") //Creating a gifts button dynamically and giving it the below attributes
       giftsButton.attr("class", "btn btn-primary")
       giftsButton.attr("class", "gifts")
       giftsButton.attr("data-state", childSnapshot.val().likes)
       giftsButton.text("View Gifts")
       giftsTd.append(giftsButton)
       var nameTd = $("<td>")
       var bdayTd = $("<td>")
      var likesTd = $("<td>")
      var daysTd = $("<td>")

        nameTd.text(childSnapshot.val().recipientName) //Pulling values for the table / rows from the firebase database
        bdayTd.text(childSnapshot.val().bday)
        likesTd.text(childSnapshot.val().likes)
        daysTd.text(childSnapshot.val().nextBirthday)
     
        row.append(giftsTd)
        row.append(nameTd)
        row.append(bdayTd)
        row.append(likesTd)
        row.append(daysTd)

        var todayConvert = moment().format("YYYY-MM-DD");

          if (childSnapshot.val().birthdayNotification == todayConvert){ //Checking through each database entry to see if today matches their selected birthday notification, then sends email using function below if it does.
           (function(){ //Here is the email js function. It stores the API key on the server side and calls with its own function browser side.
           emailjs.init("user_5PhSrglHUc15780D2cekk");
            })();
            var template_params = {
            "user_email": childSnapshot.val().email,
            "recipientName": childSnapshot.val().recipientName,
            "userName": childSnapshot.val().name,
            "likes": childSnapshot.val().likes
               }
              var service_id = "default_service"; //email JS wants to know what service to email from. By default we have the Birthdaytracker365 one.
              var template_id = "bday"; //A custom template I set up in emailjs.
              emailjs.send(service_id, template_id, template_params)
              .then(function(response) {
              console.log('SUCCESS!', response.status, response.text);
              }, function(error) {
              console.log('FAILED...', error);
              });
            }
        
        $("#tbody").append(row) //Appending the dynamically created rows to the table body.
     }

    populateBirthdays(); //Running the above function.

 });
 
 $(document).on("click", ".gifts", function(){ //This is on on click set up for when anything with the class of "gifts" is clicked. (the above button happens to have that)
  location.href = "gifts.html#load-gifts" //This is linking to our gifts.html. The hashtag after that isn't necessary but I'm keeping it because it looks cool.
  var keyword = $(this).attr("data-state") //When something with the gifts class is clicked, a keyword will be assigned. We have the data-state set up to what they have selected for "likes".
  sessionStorage.keyword = keyword //This stores the keyword above into session storage. This means when they close their window / browser it will no longer be stored. We are using this to save values between pages.
  console.log(keyword) //Console logs the keyword that we are searching for in eBay.
});

$(document).on("click", ".gift-offer", function(){ //This the on click is for the "make an offer" buttons (takes user to eBay to view the actual item)
  location.href = $(this).attr("href");
});

  var queryURL = "https://svcs.ebay.com/services/search/FindingService/v1?SECURITY-APPNAME=SamReima-Birthday-PRD-f55b8f5d2-3082faa4&OPERATION-NAME=findItemsByKeywords&SERVICE-VERSION=1.0.0&RESPONSE-DATA-FORMAT=JSON&callback=_cb_findItemsByKeywords&REST-PAYLOAD&keywords="+sessionStorage.keyword+"&paginationInput.entriesPerPage=10&GLOBAL-ID=EBAY-US&siteid=0"
  $.ajax({
        url: queryURL, //Here is the eBay ajax call.
        dataType: "script"
        })

        $("#submit").on("click", function(){ //Here is an on click for the submit button on our index page. It pulls the values from the fields and adds a new child in  firebase.
          event.preventDefault();
          name = $("#nameInput").val().trim();
          recipientName = $("#recipientName").val().trim();
          email = $("#emailInput").val().trim();
          birthdayNotification = $("#birthdayNotification").val().trim();
         var email = $("#emailInput").val().trim();
         bday = $("#birthDate").val().trim();
         likes = $( "#likes option:selected" ).text();
         dislikes = $( "#dislikes option:selected" ).text();

         var data = {
          service_id: 'default_service',
          template_id: 'welcome',
          user_id: 'user_5PhSrglHUc15780D2cekk',
          template_params: {
            "user_email": email,
              'g-recaptcha-response': '03AHJ_ASjnLA214KSNKFJAK12sfKASfehbmfd...'
          }
      };

      $.when(ajaxMail()).done(function(){ //This was tricky but this is needed so that the results page doesn't load before the email actually sends.
        location.href = "results.html"; //This will bring us to the results page after the button has been clicked.
    });

      function ajaxMail(){ //This is the 'send email function' referenced above - again, we need to put it in a  'when done' function so that the scripts waits for the email to actually send.
      return $.ajax('https://api.emailjs.com/api/v1.0/email/send', {
          type: 'POST',
          data: JSON.stringify(data),
          contentType: 'application/json'
      }).done(function() {
          console.log('Your mail is sent!');
          console.log(data);
      }).fail(function(error) {
          console.log('Oops... ' + JSON.stringify(error));
      });
    }

         function daysUntil(bday) { //momentJS birthday function
          var birthday = moment(bday);
          
          var today = moment().format("YYYY-MM-DD");
          
          // calculate age of the person
          var age = moment(today).diff(birthday, 'years');
          moment(age).format("YYYY-MM-DD");
          console.log('person age', age);
          
          var nextBirthdayMoment = moment(birthday).add(age, 'years');
          moment(nextBirthdayMoment).format("YYYY-MM-DD");
          
          /* added one more year in case the birthday has already passed
          to calculate date till next one. */
          if (nextBirthdayMoment.isSame(today)) {
            return nextBirthdayMoment
          } else {
            nextBirthdayMoment = moment(birthday).add(age + 1, 'years');
            return nextBirthdayMoment.diff(today, 'days');
          }
        }
        
        var nextBirthday = daysUntil(bday);
          
        
          database.ref().push({ //Pushing values into firebase
              name: name,
              email: email,
              bday: bday,
              likes: likes,
              birthdayNotification: birthdayNotification,
              dislikes: dislikes,
              recipientName: recipientName,
             nextBirthday: nextBirthday
         });
         });

});
    



  function _cb_findItemsByKeywords(root) { //This function is needed to define the _cb_findItemsByKeywords function referenced in the JSON (this is specific to eBay's API)
  
  var items = root.findItemsByKeywordsResponse[0].searchResult[0].item || [];

    for (var i = 0; i < items.length; ++i)   {
    var item = items[i];
    console.log(item)
    var title = item.title;
    var price = item.sellingStatus[0].currentPrice[0].__value__
    var ebayDate = item.listingInfo[0].endTime
    var pic = item.galleryURL;

    var format = "YYYY/MM/DD"; //using moment JS to convert the weird date given from eBay to a more understandable one.
    var convertedDate = moment(ebayDate, format);
    var daysLeft = Math.abs(moment(convertedDate).diff(moment(), "days"));

    if (pic != "http://thumbs1.ebaystatic.com/pict/04040_0.jpg"){ //This is needed so that we don't get blank images, or the placeholder image that eBay uses.
   
    if ($("#gift1Image").attr('src') == "") { //Checking through each card to see if there is an image there, and if not, it will fill the card with an image pulled from eBay
    $("#gift1Image").attr("src", pic);
    $("#gift1Image").attr("height", "200px")
    $("#gift1Image").attr("height", "200px")
    $("#gift1Offer").attr("href", item.viewItemURL)
    $("#giftTitle1").text(title)
    $("#giftPrice1").text("$ " + price)
    $("#giftDays1").text(daysLeft + " days left")
    }

    else if ($("#gift2Image").attr('src')== "") {
    $("#gift2Image").attr("src", pic);
    $("#gift2Image").attr("height", "200px")
    $("#gift2Image").attr("height", "200px")
    $("#gift2Offer").attr("href", item.viewItemURL)
    $("#giftTitle2").text(title)
    $("#giftPrice2").text("$ " + price)
    $("#giftDays2").text(daysLeft + " days left")
    }

    else if ($("#gift3Image").attr('src') == "") {
    $("#gift3Image").attr("src", pic);
    $("#gift3Image").attr("height", "200px")
    $("#gift3Image").attr("height", "200px")
    $("#gift3Offer").attr("href", item.viewItemURL)
    $("#giftTitle3").text(title)
    $("#giftPrice3").text("$ " + price)
    $("#giftDays3").text(daysLeft + " days left")
    }

 }
}
};

  

