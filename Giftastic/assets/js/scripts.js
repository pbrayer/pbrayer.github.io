
$(document).ready(function() {
var buttonz = ["charmander", "pikachu", "squirtle", "bulbasaur", "kadabra", "alakazam", "gengar", "articuno", "zapdos", "misty", "moltres"]



renderButtons();

$("#submit").on("click", function(){
    event.preventDefault()
    var pokemonSubmit = $("#pokemon-input").val().trim();
    if(pokemonSubmit == "") {
        alert("Please enter at least SOMETHING!")
   }
   else{
    buttonz.push(pokemonSubmit)
    renderButtons();
   }
});

function displayPokemon() {

    var pokemon = $(this).attr("data-pokemon");
    var queryURL = "https://api.giphy.com/v1/gifs/search?q=" + pokemon + "&api_key=TC8YxFS0KfF3ipGGfSpcwrcbjFivoZ1s&limit=10";
    console.log($(this).attr("data-pokemon"));

$.ajax({
    url: queryURL,
    method: "GET"
  })
    
    .then(function(response) {
      
      var results = response.data;
      console.log(results)

      for (var i = 0; i < results.length; i++) {

          if (results[i].rating !== "r") {
          
          var gifDiv = $("<div>");

           var rating = results[i].rating;

          var p = $("<p>").html("<strong>"+ "Rating: "  + rating);
          p.css("text-align", "center")
          
          var pokemonImage = $("<img>");
          
          pokemonImage.attr("src", results[i].images.fixed_height_still.url);
          pokemonImage.attr("data-state", "still");
          pokemonImage.attr("data-still", results[i].images.fixed_height_still.url);
          pokemonImage.attr("data-animate", results[i].images.fixed_height.url);
          pokemonImage.attr("class", "pokemonpic");
          pokemonImage.attr("width", "300px")
          pokemonImage.attr("height","300px")
          gifDiv.css("float", "left")

          gifDiv.append(p);
          gifDiv.append(pokemonImage);

          $("#pokemons").prepend(gifDiv);
           }
      }
        });
    };

    $(document).on("click", ".pokemons", displayPokemon);
    $(document).on("click", ".pokemonpic", function(){
        var state = $(this).attr("data-state");
       
        if (state === "still") {
          $(this).attr("src", $(this).attr("data-animate"));
          $(this).attr("data-state", "animate");
        } else {
          $(this).attr("src", $(this).attr("data-still"));
          $(this).attr("data-state", "still");
        }
  
    });

  function renderButtons() {
      $("#buttons").empty()
   for(var i = 0; i < buttonz.length; i++) {
    $("#buttons").append("<button data-pokemon=" + buttonz[i] + " class=" +" pokemons"+ ">"+ buttonz[i] + "</button>")
        }
  }

});