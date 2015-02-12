
// Print errors
window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber
    + ' Column: ' + column + ' StackTrace: ' +  errorObj);
}

// Smooth scrolling
$(function() {
    $('a[href*=#]:not([href=#])').click(function() {
        if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
            if (target.length) {
                $('html,body').animate({
                    scrollTop: target.offset().top
                }, 1000);
                return false;
            }
        }
    });
});

var source = $("#entry-template").html();
var template = Handlebars.compile(source);

for (var i = 0; i < 50; i++)
    $(".container").append(template({}));

//$(".chat-row:eq(1)").width("50%").css("font-size","7px");
console.log($(window).height());
hideAndSeek()

$(window).scroll(function(){
    hideAndSeek();
});

var limit = 100.0;

function hideAndSeek(){
    $(".chat-row").each(function(){
        // Track distance between each initial top position and 
        // original center of screen. If the distance is greater than
        // a specified fraction of the screen height, make it disappear
        var top = $(this).position().top;
        var wh = $(window).height();
        var st = $(window).scrollTop();
        var topDist = top-st; // distance from top of chat row top top of screen
        var botDist = st+wh-top; // distance from top of chat row to bottom of screen
        if (topDist < 0 || botDist < 0){
            $(this).css("opacity","0");
        }
        else if (topDist < limit){
            $(this).css({
                "opacity": topDist/limit,
                "font-size": (15*topDist/limit) + "px"
            });
            $(this).find(".bubble").css({
                "width": (80*topDist/limit) + "%"
            });
        }
        else if (botDist < limit){
            $(this).css({
                "opacity": botDist/limit,
                "font-size": (15*botDist/limit) + "px"
            });
            $(this).find(".bubble").css({
                "width": (80*botDist/limit) + "%"
            });
        }
        else {
            $(this).css({
                "opacity": "1",
                "font-size": "15px"
            });
            $(this).find(".bubble").css({
                "width": "80%"
            });
            /*$(this).find(".bubble").css({
                "background-color": "#BBFFFF"
            });*/
        }
        $(this).find(".bubble").text("top dist: " + topDist + "\nbot dist: " + botDist);
    });
};