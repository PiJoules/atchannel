

/**
 * Resizing Globals
 */

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50; // distance from mid (either above or below)
var pt, ph, mid; // parent dimensions
var limit = 100.0; // distance from mid at which to start resizing

var maxPropertiesNumeric;
if (atchannel.md.mobile()){
    maxPropertiesNumeric = {
        "font-size": 12,
        "bubbleWidth": 100,
        "margin-left": 0,
        "margin-right": 2,
        "avatarWidth": 5,
        "time-font-size": 9
    }
}
else {
    maxPropertiesNumeric = {
        "font-size": 15,
        "bubbleWidth": 100,
        "margin-left": 5,
        "margin-right": 15,
        "avatarWidth": 5,
        "time-font-size": 12
    }
}
var maxProperties = {
    "font-size": maxPropertiesNumeric["font-size"] + "px",
    "bubbleWidth": maxPropertiesNumeric["bubbleWidth"] + "%",
    "margin-left": maxPropertiesNumeric["margin-left"] + "%",
    "margin-right": maxPropertiesNumeric["margin-right"] + "%",
    "avatarWidth": maxPropertiesNumeric["avatarWidth"] + "%",
    "time-font-size": maxPropertiesNumeric["time-font-size"] + "px"
};
var defaultPropertiesNumeric = {
    "font-size": 1.5,
    "bubbleWidth": 10,
    "margin-left": 15,
    "margin-right": 15,
    "avatarWidth": 2,
    "time-font-size": 1.5
};
var defaultProperties = {
    "font-size": defaultPropertiesNumeric["font-size"] + "px",
    "bubbleWidth": defaultPropertiesNumeric["bubbleWidth"] + "%",
    "margin-left": defaultPropertiesNumeric["margin-left"] + "%",
    "margin-right": defaultPropertiesNumeric["margin-right"] + "%",
    "avatarWidth": defaultPropertiesNumeric["avatarWidth"] + "%",
    "time-font-size": defaultPropertiesNumeric["time-font-size"] + "px"
};
var vnMobileProperties = {
    "font-size": "12px",
    "bubbleWidth": "100%",
    "margin-left": "2%",
    "margin-right": "2%",
    "time-font-size": "9px"
};


/**
 * Messages Globals
 */
var intervalID;
var nextAmount = 50;
var smallestPostNumber = 0;
var largestPostNumber = 0;
var currentRow = 1;


/**
 * Main script
 */

// On scroll events
$(".chat").scroll(function(){
    hideAndSeek();
    markTimeline();

    if ($(this).scrollTop() > 50 && !$(".timeline-container").is(":visible") && window.innerWidth > 880) {
        $(".timeline-container").show("fast");
    }
    else if ($(this).scrollTop() <= 50 && $(".timeline-container").is(":visible")) {
        $(".timeline-container").hide();
    }
});
$(window).scroll(function(){
    if (!atchannel.canAnimate()){
        if ($(this).scrollTop() > 50 && !$(".timeline-container").is(":visible") && window.innerWidth > 880) {
            $(".timeline-container").show("fast");
        }
        else if ($(this).scrollTop() <= 50 && $(".timeline-container").is(":visible")) {
            $(".timeline-container").hide();
        }
    }
});

// Stuff to do on resize
$(window).resize(function(){
    resetParentDimensions();
    setTimeline();

    if (window.innerWidth <= 880 && $(".timeline-container").is(":visible")){
        $(".timeline-container").hide();
    }
    else if (window.innerWidth > 880 && $(".chat").scrollTop() > 50 && !$(".timeline-container").is(":visible")) {
        $(".timeline-container").show("fast");
    }
});

// Set the arrow functionality
$(".chat-input .prevPost").click(function(){
    scrollToPrevPost();
});
$(".chat-input .nextPost").click(function(){
    scrollToNextPost();
});
$(document).keydown(function(e) {
    // only check for arrow keys if not focused in input area
    if (!$("input").is(":focus")){
        switch(e.which) {
            case 37: // left
                scrollToPrevPost();
                break;
            case 39: // right
                scrollToNextPost();
                break;
            default: return; // exit this handler for other keys
        }
    }
});


// Username Change
$("input[type=text].submit-username").keyup(function(e){
    if(e.keyCode == 13) {
        setUsername();
    }
});
$("#submit-username").click(function(){
    setUsername();
});
$(".message").attr("placeholder", "Post message as '" + atchannel.getUsername() + "'");


// Posting
$("input[type=text].message").keyup(function(e){
    if(e.keyCode == 13) {
        postMessage();
    }
});


// Channel submission
$("#new-channel-name").keyup(function(e){
    if(e.keyCode == 13) {
        submitChannel();
    }
    else {
        $(".new-channel-name").text($("#new-channel-name").val().trim() + "Channel");
    }
});
$("#submit-channel").click(function(){
    submitChannel();
});


// Load more posts
$(".load-prev").click(function(){
    getPosts();
});


// Resize title
$(".fit-text").fitText(1.2);


// Design toggle
$("input.toggle-style").bootstrapSwitch({
    onText: "Anime",
    offText: "VN",
    state: atchannel.isAnimeStyle(),
    onSwitchChange: function(event, state){
        if (state){
            setStyle(atchannel.styles.anime);
            if (!atchannel.md.mobile())
                $("input.toggle-resize").bootstrapSwitch("disabled", false);
        }
        else {
            setStyle(atchannel.styles.vn);
            $("input.toggle-resize").bootstrapSwitch("disabled", true);
        }
    }
});


// Toggle resize animation
$("input.toggle-resize").bootstrapSwitch({
    state: atchannel.canAnimate(),
    disabled: (atchannel.isVNStyle() || atchannel.md.mobile()),
    onSwitchChange: function(event, state){
        setCanAnimate(state);
    }
});


// Stuff to do after the window loads
// Only need to include stuff that requires elements in the window
$(window).load(function(){
    resetParentDimensions();

    if ( ($(".chat").scrollTop() <= 50 && $(window).scrollTop() <= 50) || window.innerWidth <= 880 )
        $(".timeline-container").hide();

    largestPostNumber = parseInt($(".chat-row .postNumber").last().text());
    smallestPostNumber = parseInt($(".chat-row .postNumber").first().text());
    setTimeline();

    hideAndSeek();

    if (atchannel.isAnimeStyle()){
        prepareAnime();
    }
    else {
        prepareVN();
    }

    if (atchannel.canAnimate()){
        prepareAnimations()
    }
    else {
        removeAnimations();
    }

});



/**
 * Channel specific functions
 */


/**
 * Set username
 */
function setUsername(){
    var success = atchannel.setUsername($("#selected-user-name").val());
    if (success){
        $(".message").attr("placeholder", "Post message as '" + atchannel.getUsername() + "'");
        $("#settings-modal").modal("hide");
    }
    else {
        alert("Invalid username");
    }
}

/**
 * Send a message to the server and refresh on success
 */
function postMessage(){
    var m = $(".message").val().trim();
    if (m !== ""){
        $.post("/addPost", {channel: channel, name: name, time: Date.now(), message: m}).done(function(response){
            if (response !== ""){
                alert(response);
            }
            else {
                // success
                location.reload();
            }
        }).fail(function(jqXHR, textStatus, errorThrown){
            alert([textStatus, errorThrown]);
        });
    }
}

/**
 * Post a new channel to be made for the database
 */
function submitChannel(){
    var channelName = $("#new-channel-name").val().trim()
    atchannel.submitChannel(channelName, function(){
        window.location.replace("/" + channelName);
    });
}


function getPosts(){
    $.get("/getPosts", {channel: channel, start: messagesCount, length: nextAmount}).done(function(response){
        messagesCount += response.messages.length;

        if (response.messages.length < nextAmount){
            $(".load-prev").parent().remove();
        }
        else {
            $("#marker").after(response.html);

            largestPostNumber = parseInt($(".chat-row .postNumber").last().text());
            smallestPostNumber = parseInt($(".chat-row .postNumber").first().text());
            setTimeline();

            if (atchannel.canAnimate())
                hideAndSeek();
            else if (atchannel.md.mobile() && atchannel.isVNStyle())
                changeRow($(".chat-row"), vnMobileProperties);
            else
                changeRow($(".chat-row"), maxProperties);

            if (atchannel.isAnimeStyle()){
                prepareAnime();
            }
            else {
                prepareVN();
            }
        }
    }).fail(function(jqXHR, textStatus, errorThrown){
        alert([textStatus, errorThrown]);
    });
}




/**
 * Function for actually resizing a row
 */
function changeRow(that, properties){
    var nextProperties = $.extend({}, defaultProperties, properties);
    that.css({
        "font-size": nextProperties["font-size"],
        "margin-left": nextProperties["margin-left"],
        "margin-right": nextProperties["margin-right"]
    });
    that.find(".bubble").css({
        "width": nextProperties["bubbleWidth"]
    });
    that.find(".avatar").css({
        "width": nextProperties["avatarWidth"]
    });
    that.find(".anime-time").css({
        "font-size": nextProperties["time-font-size"]
    });
}




/**
 * Function for choosing the rows to resize
 */
function hideAndSeek(){
    if (atchannel.canAnimate() && atchannel.isAnimeStyle()){
        // limit the rows to resize only to those onscreen
        var rows = $(".chat-row").filter(function(index){
            var top = $(this).position().top;
            return top+$(this).outerHeight() > 0 && top < ph;
        });
        changeRow($(".chat-row").not(rows));
        rows.each(function(index){
            hidingFunction($(this));
        });
    }
}


/**
 * Function for choosing how to resize each row
 */
function hidingFunction(that){

    // Track distance between each initial top position and
    // original center of screen. If the distance is greater than
    // a specified fraction of the screen height, make it disappear
    var midDist = Math.abs(that.position().top - mid);

    if (midDist > limit+buffer){
        changeRow(that);
    }
    else if (midDist < buffer) {
        changeRow(that, maxProperties);
        currentRow = $(".chat-row").index(that);
    }
    else {
        /**
         * property = (max-default)/limit*(midDist-buffer) + max
         */
        var properties = {
            "font-size": ( ( defaultPropertiesNumeric["font-size"]-maxPropertiesNumeric["font-size"] )/limit*(midDist-buffer) + maxPropertiesNumeric["font-size"] ) + "px",
            "bubbleWidth": ( ( defaultPropertiesNumeric["bubbleWidth"]-maxPropertiesNumeric["bubbleWidth"] )/limit*(midDist-buffer) + maxPropertiesNumeric["bubbleWidth"] ) + "%",
            "margin-left": ( ( defaultPropertiesNumeric["margin-left"]-maxPropertiesNumeric["margin-left"] )/limit*(midDist-buffer) + maxPropertiesNumeric["margin-left"] ) + "%",
            "margin-right": ( ( defaultPropertiesNumeric["margin-right"]-maxPropertiesNumeric["margin-right"] )/limit*(midDist-buffer) + maxPropertiesNumeric["margin-right"] ) + "%",
            "avatarWidth": ( ( defaultPropertiesNumeric["avatarWidth"]-maxPropertiesNumeric["avatarWidth"] )/limit*(midDist-buffer) + maxPropertiesNumeric["avatarWidth"] ) + "%",
            "time-font-size": ( ( defaultPropertiesNumeric["time-font-size"]-maxPropertiesNumeric["time-font-size"] )/limit*(midDist-buffer) + maxPropertiesNumeric["time-font-size"] ) + "px"
        };
        changeRow(that, properties);
    }

}


/**
 * Color the tick that is the closest to the current row
 * If an index is provided, that will be marked
 */
function markTimeline(index){
    if (typeof index === "undefined"){
        if ($(".timeline a[data-index='" + currentRow + "']").length > 0){
            $(".timeline li").css("background-color", "initial");
            $(".timeline a[data-index='" + currentRow + "']").parent().css("background-color", "#abdfde");
        }
    }
    else {
        $(".timeline li").css("background-color", "initial");
        $(".timeline li:eq(" + index + ")").css("background-color", "#abdfde");
    }
}


/**
 * Set parent top, parent height, and the screen's fixed midpoint (vertically)
 */
function resetParentDimensions(){
    pt = $(".chat").position().top; // parent top
    ph = $(".chat").height(); // parent height
    mid = pt + ph/2 - bottomBuffer;
}



/**
 * Scroll to a row until it's equal to the current row
 */
function scrollToPost(dest,callback){
    if (currentRow !== dest){
        $(".chat").animate({
            scrollTop: $(".chat").scrollTop() + $(".chat-row:eq(" + dest + ")").position().top - ph/2
        }, "fast", function(){
            scrollToPost(dest, callback);
        });
    }
    else if (typeof callback !== "undefined") {
        callback();
    }
}
function scrollToPrevPost(){
    $(".chat").animate({
        scrollTop: $(".chat").scrollTop() - $(".chat-row:eq(" + (currentRow-1) + ")").outerHeight()
    }, "fast");
}
function scrollToNextPost(){
    $(".chat").animate({
        scrollTop: $(".chat").scrollTop() + $(".chat-row:eq(" + (currentRow+1) + ")").outerHeight()
    }, "fast");
}


/**
 * Function for setting the colors of each of the bubbles
 */
function setBubbleColors(){
    $(".chat-row .bubble").each(function(){
        var color = $(this).data("color");
        $(this).css({
            "background-color": color,
            "border-color": "transparent " + color
        });
    });
}


/**
 * Function for saving the current style
 */
function setStyle(style){
    atchannel.setStyle(style);

    // stuff to do after changing the styles
    if (atchannel.isAnimeStyle()){
        prepareAnime();
    }
    else {
        prepareVN();
    }
}


/**
 * Initliaze the timeline whenever
 */
function setTimeline(){
    if (atchannel.isAnimeStyle()){
        // Fill the timeline with ticks
        var ticHeight = 30; // the height of each li element in px
        var ticCount = parseInt((window.innerHeight-50)/ticHeight)+1;
        var postGap = parseFloat( (largestPostNumber-smallestPostNumber+1)/ticCount );
        $(".timeline").empty();
        var lastNumber = -1;
        for (var i = 0; i < ticCount; i++){
            var index = Math.ceil(postGap*i);

            // ensure the line doesn't go past the total number of posts
            if (index > $(".chat-row").length-1)
                break;

            // ensure no duplicate numbers are shown
            if (index !== lastNumber){
                $(".timeline").append("<li><a href='javascript: void(0)' data-index='" + index + "'>" + (index+smallestPostNumber) + "</a> -</li>");
            }

            lastNumber = index;
        }

        // Mark the tick of the current row
        markTimeline();

        $(".timeline a").click(function(){
            var index = parseInt($(this).data("index"));
            if (atchannel.canAnimate()){
                scrollToPost(index, markTimeline);
            }
            else {
                currentRow = index;
                window.location.href = "#post" + (index+smallestPostNumber);
            }
        });
    }
}


/**
 * Function for setting canAnimate into session storage
 */
function setCanAnimate(animate){
    atchannel.setAnimate(animate);

    if (atchannel.canAnimate()){
        prepareAnimations()
    }
    else {
        removeAnimations();
    }
}


/**
 * Stuff to do to set up animations
 */
function prepareAnimations(){
    $(".chat").css({
        "height": "calc(100% - 50px)",
        "overflow-y": "scroll"
    });
    resetParentDimensions();

    hideAndSeek();
}


/**
 * Stuff to do to set up no animations
 */
function removeAnimations(){
    $(".chat").css({
        "height": "auto",
        "overflow-y": "visible"
    });

    if (atchannel.md.mobile() && atchannel.isVNStyle()) {
        changeRow($(".chat-row"), vnMobileProperties);
    }
    else {
        changeRow($(".chat-row"), maxProperties);
    }
}


/**
 * Stuff to do after switching to anime
 */
function prepareAnime(){
    $("body").removeClass("vn").addClass("anime");
    $("#background-image").show();

    setBubbleColors();

    if (atchannel.canAnimate())
        hideAndSeek();
    else
        changeRow($(".chat-row"), maxProperties);

    setTimeline();
}


/**
 * Stuff to do after switching to vn
 */
function prepareVN(){
    $("body").removeClass("anime").addClass("vn");
    $("#background-image").hide();

    // Remove all inline styles
    $(".chat-row *").removeAttr("style");
    $(".chat-row").removeAttr("style");

    if (atchannel.md.mobile()){
        changeRow($(".chat-row"), vnMobileProperties);
    }
}
