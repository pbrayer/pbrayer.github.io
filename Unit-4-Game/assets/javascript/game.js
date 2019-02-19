$(document).ready(function() {

var liu = {
       Name: "Liu Kang",
       AtkPower: 8, 
       Hp: 120,
       CounterAtkPower: 20
}

var raiden = {
Name: "Raiden",
AtkPower:  8,
Hp: 150,
CounterAtkPower: 15
}

var jcage = {
Name: "Johnny Cage",
AtkPower: 8,
Hp: 100,
CounterAtkPower: 25
}

var scorpion = {
    AtkPower: 8,
    Hp: 180,
    CounterAtkPower: 5,
    Name: "Scorpion"
}

var chosenCharacter;
var chosenEnemy;
var victory = new Audio('assets/music/victory.mp3');
var might = new Audio('assets/music/might.mp3');


$(".container").hide()
$("#victory").hide();
$("#button-3").hide();

$("#initialize").on("click", function() {
    if ($(".container").is(":hidden")){
    initialize();
    $(".container").show();
    might.play();
}
});

function initialize () {

$("#liuName").html(liu.Name);
$("#jcageName").html(jcage.Name);
$("#raidenName").html(raiden.Name);
$("#scorpionName").html(scorpion.Name);

$("#liuHp").html(liu.Hp);
$("#jcageHp").html(jcage.Hp);
$("#raidenHp").html(raiden.Hp);
$("#scorpionHp").html(scorpion.Hp);

$(".avatar").show();
$(".avatarEnemy").hide();
$(".avatarDefend").hide();
$("#button-2").hide();
};

function enemyNamesHP () {

$("#choose").html("Your Character");

$("#liuNameEnemy").html(liu.Name);
$("#jcageNameEnemy").html(jcage.Name);
$("#raidenNameEnemy").html(raiden.Name);
$("#scorpionNameEnemy").html(scorpion.Name);

$("#liuHpEnemy").html(liu.Hp);
$("#jcageHpEnemy").html(jcage.Hp);
$("#raidenHpEnemy").html(raiden.Hp);
$("#scorpionHpEnemy").html(scorpion.Hp);
}

function defendNamesHP () {
    
    $("#liuNameDefend").html(liu.Name);
    $("#jcageNameDefend").html(jcage.Name);
    $("#raidenNameDefend").html(raiden.Name);
    $("#scorpionNameDefend").html(scorpion.Name);
    
    $("#liuHpDefend").html(liu.Hp);
    $("#jcageHpDefend").html(jcage.Hp);
    $("#raidenHpDefend").html(raiden.Hp);
    $("#scorpionHpDefend").html(scorpion.Hp);

}


$(".avatar .jcage").on("click", function() {
    $("#liu").hide();
    $("#scorpion").hide();
    $("#raiden").hide();

    if($("#liuDefend").is(":hidden")){
        $("#liuEnemy").show();}
    if($("#raidenDefend").is(":hidden")){
        $("#raidenEnemy").show();}
    if ($("#scorpionDefend").is(":hidden")){
        $("#scorpionEnemy").show();}

    
    enemyNamesHP();
});

$(".avatar .liu").on("click", function() {
    $("#jcage").hide();
    $("#scorpion").hide();
    $("#raiden").hide();

    if ($("#jcageDefend").is(":hidden")){
        $("#jcageEnemy").show();}
    if ($("#raidenDefend").is(":hidden")){
        $("#raidenEnemy").show();}
    if ($("#scorpionDefend").is(":hidden")){
        $("#scorpionEnemy").show();}

    enemyNamesHP();
});

$(".avatar .raiden").on("click", function() {
    $("#liu").hide();
    $("#scorpion").hide();
    $("#jcage").hide();

    if ($("#liuDefend").is(":hidden")){
        $("#liuEnemy").show();}
    if($("#jcageDefend").is(":hidden")){
        $("#jcageEnemy").show();}
    if($("#scorpionDefend").is(":hidden")){
        $("#scorpionEnemy").show();}

    enemyNamesHP();
});

$(".avatar .scorpion").on("click", function() {
    $("#liu").hide();
    $("#jcage").hide();
    $("#raiden").hide();

    if($("#liuDefend").is(":hidden")){
        $("#liuEnemy").show();}
    if($("#raidenDefend").is(":hidden")){
        $("#raidenEnemy").show();}
    if($("#jcageDefend").is(":hidden")){
        $("#jcageEnemy").show();}

    enemyNamesHP();
});

$("#liuEnemy").on("click", function() {
    if($("#raidenDefend").is(":hidden")&&$("#jcageDefend").is(":hidden")&&$("#scorpionDefend").is(":hidden")){
         $("#liuDefend").show();
         $("#liuEnemy").hide();}
    defendNamesHP();
});

$("#raidenEnemy").on("click", function() {
    if($("#liuDefend").is(":hidden")&&$("#jcageDefend").is(":hidden")&&$("#scorpionDefend").is(":hidden")){
    $("#raidenEnemy").hide();
    $("#raidenDefend").show();}
    defendNamesHP();
});

$("#jcageEnemy").on("click", function() {
    if($("#raidenDefend").is(":hidden")&&$("#liuDefend").is(":hidden")&&$("#scorpionDefend").is(":hidden")){
    $("#jcageEnemy").hide();
    $("#jcageDefend").show();}
    defendNamesHP();
});

$("#scorpionEnemy").on("click", function() {
    if($("#raidenDefend").is(":hidden")&&$("#jcageDefend").is(":hidden")&&$("#liuDefend").is(":hidden")){
    $("#scorpionEnemy").hide();
    $("#scorpionDefend").show();}
    defendNamesHP();
});

$("#button-2").on("click", function() {
    location.reload();
});

$("#button-3").on("click", function() {
    location.reload();
});

$(".attack").on("click", function() {

if($("#liu").is(":visible")){
   chosenCharacter = liu;
   $("#liuHp").html(chosenCharacter.Hp);
   $("#liuName").html(chosenCharacter.Name);
};

if($("#jcage").is(":visible")){
   chosenCharacter = jcage;
   $("#jcageHp").html(chosenCharacter.Hp);
   $("#jcageName").html(chosenCharacter.Name);
};

if($("#raiden").is(":visible")){
   chosenCharacter = raiden;
   $("#raidenHp").html(chosenCharacter.Hp);
   $("#raidenName").html(chosenCharacter.Name);
};

if($("#scorpion").is(":visible")){
   chosenCharacter = scorpion;
   $("#scorpionHp").html(chosenCharacter.Hp);
   $("#scorpionName").html(chosenCharacter.Name);
};

if($("#scorpionDefend").is(":visible")){
    chosenEnemy = scorpion;
    $("#scorpionHpDefend").html(chosenEnemy.Hp);
    $("#scorpionNameDefend").html(chosenEnemy.Name);
    $("#restart").html("You attacked Scorpion for " + chosenCharacter.AtkPower + " damage.  Scorpion attacked you back for " + chosenEnemy.CounterAtkPower + " damage.");
};

if($("#liuDefend").is(":visible")){
    chosenEnemy = liu;
    $("#liuHpDefend").html(chosenEnemy.Hp);
    $("#liuNameDefend").html(chosenEnemy.Name);
    $("#restart").html("You attacked Liu for " + chosenCharacter.AtkPower + " damage.  Liu attacked you back for " + chosenEnemy.CounterAtkPower + " damage.");
};

if($("#jcageDefend").is(":visible")){
    chosenEnemy = jcage;
    $("#jcageHpDefend").html(chosenEnemy.Hp);
    $("#jcageNameDefend").html(chosenEnemy.Name);
    $("#restart").html("You attacked Johnny Cage for " + chosenCharacter.AtkPower + " damage.  Johnny Cage attacked you back for " + chosenEnemy.CounterAtkPower + " damage.");

};

if($("#raidenDefend").is(":visible")){
    chosenEnemy = raiden;
    $("#raidenHpDefend").html(chosenEnemy.Hp);
    $("#raidenNameDefend").html(chosenEnemy.Name);
    $("#restart").html("You attacked Raiden for " + chosenCharacter.AtkPower + " damage.  Raiden attacked you back for " + chosenEnemy.CounterAtkPower + " damage.");
};


function winCondition () {if(chosenEnemy.Hp <= 0 && chosenCharacter.Hp >0){
    $("#restart").html("You have defeated " + chosenEnemy.Name + ". You may now choose another combatant.");
    $("#scorpionDefend").hide();
    $("#raidenDefend").hide();
    $("#jcageDefend").hide();
    $("#liuDefend").hide();
    if ($("#jcageEnemy").is(":hidden") && $("#raidenEnemy").is(":hidden") && $("#liuEnemy").is(":hidden") && $("#scorpionEnemy").is(":hidden")){
        console.log("Victory");
        $(".container").hide();
        $("#victory").show();
        $("#button-3").show();
        victory.play();
    }
}
}

if(chosenCharacter.Hp <= 0) {
    $("#restart").html("You have lost to " + chosenEnemy.Name + ". How pathetic.");
    $("#button-2").show();
}

if(chosenEnemy.Hp > 0){
    chosenEnemy.Hp = (chosenEnemy.Hp - chosenCharacter.AtkPower);
    winCondition ();
    chosenCharacter.Hp = (chosenCharacter.Hp - chosenEnemy.CounterAtkPower);
    chosenCharacter.AtkPower += 8;}
});

});


