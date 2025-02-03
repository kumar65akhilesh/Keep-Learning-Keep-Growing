$(document).ready(function() {
    $("h1").css("color","red");
});


$("button").html("<em>dont click</em>");
$("button").text("<em>dont click</em>");

$("h1").click(function(){
    $("h1").css("color","purple")
});

$("button").click(function(){
    $("h1").fadeIn();
});

$("input").keyup(function(e) {
    console.log(e.key);
    console.log($("input").val());
    console.log($("input").val().length);
    $("h1").html(e.key);
});

$("h1").on("mouseover", function(){
    $("h1").animate({opacity:0.5});
});

$("h1").before("<button>click Me</button>");




