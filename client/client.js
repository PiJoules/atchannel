/**
* Templates
*/

Template.chatrow.helpers({
    messages: function() {
        var messages = Messages.find({}, { sort: { time: 1}});
        var messagesArray = messages.fetch();
        if (messagesArray.length > 100){
            // just for development, limit the size of the collection
            for (var i = 0; i < 50; i++){
                Messages.remove(messagesArray[i]["_id"]);
            }
        }
        if (messagesArray.length > 0){
            hideAndSeek();
            $(".chat").animate({
                scrollTop: $(".chat")[0].scrollHeight
            }, "slow");
        }
        return messages;
    }
});

Handlebars.registerHelper("prettifyTime", function(timestamp) {
    var dateObj = new Date(timestamp);
    return new Date(timestamp).toLocaleString();
});

Template.input.events = {
    'keydown input#message' : function (event) {
        if (event.which == 13) { // 13 is the enter key event
            post();
        }
    }
};



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


var w = 90;


$(window).load(function(){
    var limit = 100.0;
    // Because botDist measures dist from top of elem to bottom,
    // add a buffer to allow for elems coming from bottom to be invisible more
    var bottomBuffer = 0;
    var pt = $(".chat").position().top; // parent top
    var ph = $(".chat").height(); // parent height

    $(".chat").scroll(function(){
        hideAndSeek();
    });

    hideAndSeek = function(){
        $(".chat-row").each(function(index){
            // Track distance between each initial top position and
            // original center of screen. If the distance is greater than
            // a specified fraction of the screen height, make it disappear
            var topDist = $(this).position().top; // distance from top of chat row top top of screen
            var botDist = ph+pt-topDist; // distance from top of chat row to bottom of screen
            if (topDist < 0 || botDist < 0){
                $(this).css("opacity","0");
            }
            else if (topDist < limit){
                $(this).css({
                    "opacity": topDist/limit,
                    "font-size": (15*topDist/limit) + "px"
                });
                $(this).find(".bubble").css({
                    "width": (w*topDist/limit) + "%"
                });
            }
            else if (botDist < limit+bottomBuffer){
                $(this).css({
                    "opacity": botDist/(limit+bottomBuffer),
                    "font-size": (15*botDist/(limit+bottomBuffer)) + "px"
                });
                $(this).find(".bubble").css({
                    "width": (w*botDist/(limit+bottomBuffer)) + "%"
                });
            }
            else {
                $(this).css({
                    "opacity": "1",
                    "font-size": "15px"
                });
                $(this).find(".bubble").css({
                    "width": w + "%"
                });
            }
        });
    };

    post = function(){
        if (Meteor.user())
            var name = Meteor.user().profile.name;
        else
            var name = 'Anonymous';

        if ($("#message").val().trim() !== ""){
            Messages.insert({
                name: name,
                message: $("#message").val().trim(),
                time: Date.now()
            });

            $("#message").val("");

            $(".chat").animate({
                scrollTop: $(".chat")[0].scrollHeight
            }, "slow");
        }
    };

    $("#post").click(function(){
        post();
    });

});