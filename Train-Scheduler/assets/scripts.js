$(document).ready(function() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyC6NkjTv2Lu0yNayvpffN8W5EQr1N7NFp0",
    authDomain: "train-scheduler-e0986.firebaseapp.com",
    databaseURL: "https://train-scheduler-e0986.firebaseio.com",
    projectId: "train-scheduler-e0986",
    storageBucket: "train-scheduler-e0986.appspot.com",
    messagingSenderId: "822104532279"
  };
  firebase.initializeApp(config);

  var bubbRubb = new Audio('assets/audio/woo.mp3');
  
  
    
  
  
   var database = firebase.database();
   
  
  
  
  
   database.ref().on("child_added", function(childSnapshot) {
      function populateTrains(){
        var row = $("<tr>")
        var nameTd = $("<td>")
        var destinationTd = $("<td>")
        var frequencyTd = $("<td>")
        var nextTd = $("<td>")
        var minutesTd = $("<td>")
         nameTd.text(childSnapshot.val().name)
        destinationTd.text(childSnapshot.val().destination)
         frequencyTd.text(childSnapshot.val().frequency)
         var firstTimeConverted = moment(childSnapshot.val().time, "HH:mm").subtract(1, "years");
         var diffTime = moment().diff(moment(firstTimeConverted), "minutes");
         var tRemainder = diffTime % childSnapshot.val().frequency;
         var minutes = childSnapshot.val().frequency - tRemainder;
         var next = moment().add(minutes, "minutes");
         nextTd.text(next)
         minutesTd.text(minutes)
         row.append(nameTd)
         row.append(destinationTd)
          row.append(frequencyTd)
          row.append(nextTd)
          row.append(minutesTd)
         $("#table").append(row)
       }
  
      populateTrains();
  
   });
  
  

  
  
  
  
      $("#submit").on("click", function(){
        event.preventDefault();
        bubbRubb.play();
        name = $("#name-input").val().trim();
        destination = $("#destination-input").val().trim();
        frequency = $("#frequency-input").val().trim();
        time = $("#time-input").val().trim();

        if (name == "" || destination == "" || frequency == "" || time == ""){
            alert("Please complete all required fields.")
        }
        else{

        database.ref().push({
            name: name,
            destination: destination,
            frequency: frequency,
            time: time,
       });
    }
  
  });
  });