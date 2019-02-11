var alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
var characters = ["frodo", "samwise", "gandalf", "aragorn", "arwen", "elrond", "legolas", "gimli", "bilbo", "gollum", "sauron", "saruman", "balrog", "eowyn", "galadriel", "boromir", "faramir", "theoden", "shelob", "isildur", "radagast"];

var gameStarted = false;
var currentWord;
var wordAsDashes;
var guessesLeft;
var lettersGuessed;
var numWins = 0;
var numLosses = 0;
var wordPlace; 
var correctGuesses;
var wordAsArr = [];
var dashesArray = [];
var hobbitTrill;

function initialize() {
    gameStarted = true;
	lettersGuessed = [];
	correctGuesses = 0;
	wordPlace = Math.floor(Math.random() * characters.length);
	currentWord = characters[wordPlace];			
	guessesLeft = 15 - currentWord.length;		
	wordAsDashes = makeIntoDashes(currentWord);	
	wordAsArr = currentWord.split('');			
	dashesArray = wordAsDashes.split('');		
	document.getElementById("currentWord").innerHTML = wordAsDashes;
	document.getElementById("lettersGuessed").innerHTML = "--";
    document.getElementById("guessesLeft").innerHTML = guessesLeft;
    document.getElementById("boromir").src = "assets/images/One-Does-Not-Simply.jpg";
}


function makeIntoDashes(word) {
	var dashes = "";
	for (i = 0; i < word.length - 1; i++) {
		dashes += "_ ";
	}
	dashes += "_";
	return dashes;
}


function playGame(letter) {
    var letter = letter.toLowerCase();
    console.log(currentWord);

	
	if (alphabet.indexOf(letter) > -1) {
		if (wordAsArr.indexOf(letter) > -1) {
			correctGuesses++;
			displayLetter(letter);
		}
		else {
			if (lettersGuessed.indexOf(letter) > -1) {
				return;
			}
			else {
				guessesLeft--;
				document.getElementById("guessesLeft").innerHTML = guessesLeft;
				lettersGuessed.push(letter);
				document.getElementById("lettersGuessed").innerHTML = lettersGuessed.join(' ');
				if (guessesLeft == 0) {
					alert("Wrong. The correct answer was " + currentWord);
					initialize();
					numLosses++;
					document.getElementById("losses").innerHTML = numLosses;
				}
			}
		}
	}
}


function displayLetter(letter) {
	for (i = 0; i < currentWord.length; i++) {
		if (letter == wordAsArr[i]) {
			dashesArray[i * 2] = letter;
			console.log(dashesArray);
		}
	}
	document.getElementById("currentWord").innerHTML = dashesArray.join("");
	checkForWin();
}


function checkForWin() {
	if (dashesArray.indexOf("_") === -1) {
        var hobbitTrill = new Audio('assets/music/hobbit.mp3');
        document.getElementById("boromir").src = "assets/images/hobbits.gif";
        hobbitTrill.onended = function () {
            alert("Correct. The answer was " + currentWord);
            initialize();
        };
        hobbitTrill.play();
		numWins++;
		document.getElementById("wins").innerHTML = numWins;
	}
}

document.onkeyup = function (event) {
	if (!gameStarted) {
		document.getElementById("enterKey").innerHTML = "";
		initialize();
		document.getElementById("currentWord").innerHTML = wordAsDashes.split(",");
		console.log(currentWord);
		gameStarted = true;
	}
	else {
        playGame(event.key);
	}
}