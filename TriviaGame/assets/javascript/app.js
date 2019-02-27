$(document).ready(function() {

    $("#restart").hide();
    $("#next").hide();

    var trivia = {questions: ["Where did Daenerys hatch her dragon eggs?", "What is Jon Snow's real bastard surname?", "What is the name of Arya Stark's sword?", "What is the name of Daenerys' largest Dragon?", "Why is Jaime called the 'Kingslayer'?",
                                           "Who paralyzed Bran?", "What is an alias for Beric Dondarrion?", "What houses' motto is 'As high as Honor?'"],
                         choices: ["In a lightning storm", "In a fireplace", "In a funeral pyre", "In a frozen cave", "Snow", "Sand", "Stone", "Pyke", "Hogsmeade", "Dawnbringer", "Needle", "Rapier", "Big Papa", "Viserion", "Rhaegal", "Drogon",
                        "He killed the mad king", "He killed Bowser", "He killed Ned Stark", "He killed King Joffrey", "Jaime Lannister", "Daenerys Targaryen", "Tommen Stark", "Caitlyn Stark", "Lord of Light", "The Mad King", "Charlie Brown",
                        "Lightning Lord", "House Stark", "House Arryn", "House Tully", "House Tyrell"],
                         correctAns: [3, 2, 3, 4, 1, 1, 4, 2],
                         images: ["assets/images/q1.jpg", "assets/images/q2.png", "assets/images/q3.jpg", "assets/images/q4.jpg" ,"assets/images/q5.jpg" , "assets/images/q6.gif", "assets/images/q7.jpg", "assets/images/q8.jpg"],
}
    var ansNum = 0;
    var timer = 16;
    var intervalId;
    var counter = 0;
    var totalCorrect = 0;
    var totalWrong = 0;
    var unAns = 0;
    var theme = new Audio('assets/audio/got.mp3');
    
    $("#start").on("click", function() {
        run();
        populate();
        $(this).hide()
        theme.play()
    })
    
    $("#a1").on("click", function() {
        hideStopNext()
        checkAns(1)
    })
    $("#a2").on("click", function() {
        hideStopNext()
        checkAns(2)
    })
    $("#a3").on("click", function() {
        hideStopNext()
        checkAns(3)
    })
    $("#a4").on("click", function() {
        hideStopNext()
        checkAns(4)
    })

    $("#next").on("click", function() {
        run();
        populate();
        $(this).hide()
        $("#result").html("")
        $("#pic").html("")
        if(ansNum === 8){
            var percentage = Math.round((totalCorrect / 8) * 100)
            var letterGrade
            if (percentage >= 90){letterGrade = "A.. Wow! What a nerd! Nice job!"}
            if (percentage >= 80 && percentage < 90){letterGrade = "B"}
            if (percentage >= 70 && percentage < 80){letterGrade = "C"}
            if (percentage >= 60 && percentage < 70){letterGrade = "D"}
            if (percentage < 60){letterGrade = "F you fail! Failure!"}
            $("#result").html("Correct answers: " + totalCorrect + "<br>" + "Wrong answers: " + totalWrong + "<br>" + "Unanswered questions: " + unAns + "<br>" + "Percentage Correct: " + percentage + "%"
            + "<br>" + "Letter Grade: " + "<b>" + letterGrade + "</b>")
            $("#question").hide()
            stop();
            $("#tremaining").hide()
            $("#restart").show()
        }
    })

    $("#restart").on("click", function() {
        ansNum = 0;
        counter = 0;
        totalCorrect = 0;
        totalWrong = 0;
        unAns = 0;
        $("#restart").hide();
        $("#next").hide();
        $("#question").show()
        $("#result").html("")
        run()
        $("#tremaining").show()
        populate()
        theme.play()
    })

    function checkAns(number){
        if (number === trivia.correctAns [ansNum]){
            $("#result").html("<h2>" + "<b>" + "Great Job!" + "</b>" + "</h2>")
            $("pic").show()
            $("#pic").html("<img src= " + trivia.images[ansNum] + " </img>")
            totalCorrect++
        }
        else {
            $("#result").html("<h2>"+ "<b>" + "Wrong!"+ "</b>" + "</h2>")
            $("pic").show()
            $("#pic").html("<img src= " + "assets/images/wrong.gif </img>")
            totalWrong++
        }
        ansNum++;
    }

    function hideStopNext () {
        hideAns()
        stop()
        $("#next").show()
    }
    
    function populate() {
        $("#question").html("<h1>" + trivia.questions[ansNum] + "</h1>")
            $("#a1").html(trivia.choices[counter])
            counter++
            $("#a2").html(trivia.choices[counter])
            counter++
            $("#a3").html(trivia.choices[counter])
            counter++
            $("#a4").html(trivia.choices[counter])
            counter++
            timer = 16;
            console.log(trivia.correctAns[ansNum])
    }

    function hideAns() {
        $("#a1").html("")
        $("#a2").html("")
        $("#a3").html("")
        $("#a4").html("")
    }

    function decrement() {

        timer--;
  
        $("#tremaining").html("Time Remaining: " + timer);
  
        if (timer === 0) {
  
          stop();
  
          $("#result").html("Out of time")
          hideAns();
          $("#next").show()
          unAns++
          ansNum++
        }
      }

      function run() {
        intervalId = setInterval(decrement, 1000);
      }

      function stop() {
          clearInterval(intervalId);
      }

});

