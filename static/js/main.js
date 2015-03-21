

/**
 * Resizing Globals
 */

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50; // distance from mid (either above or below)
var pt, ph, mid; // parent dimensions
var limit = 100.0; // distance from mid at which to start resizing

var maxPropertiesNumeric = {
    "font-size": 15,
    "bubbleWidth": 100,
    "margin-left": 5,
    "margin-right": 10,
    "avatarWidth": 5,
    "time-font-size": 12
};
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


/**
 * Messages Globals
 */
var intervalID;
var nextAmount = 50;
var smallestPostNumber = 0;
var largestPostNumber = 0;


/**
 * Page Globals
 */
var name = 'Anonymous';
var currentRow = 1;
var styles = Object.freeze({
    "anime": 1,
    "vn": 2
}); // use freeze to prevent object from changing
var md = new MobileDetect(window.navigator.userAgent);

var currentStyle;
if (sessionStorage.getItem("style") === null){
    if (md.mobile()){
        setStyle(styles.vn);
    }
    else {
        setStyle(styles.anime);
    }
}
else {
    currentStyle = parseInt(sessionStorage.getItem("style"));
}


/**
 * Main script
 */

// Set design
switchDesigns(currentStyle);
$(".design-switch").click(function(){
    switchDesigns();
});

// On scroll events
$(".chat").scroll(function(){
    hideAndSeek();
    markTimeline();

    if ($(this).scrollTop() > 50 && !$(".timeline-container").is(":visible")) {
        $(".timeline-container").show("fast");
    }
    else if ($(this).scrollTop() <= 50 && $(".timeline-container").is(":visible")) {
        $(".timeline-container").hide();
    }
});

// Stuff to do on resize
$(window).resize(function(){
    resetParentDimensions();
    setTimeline();
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
if (localStorage.getItem("atchannelUsername") === null){
    $('#myModal').modal();
}
else{
    name = localStorage.getItem("atchannelUsername");
    $(".message").attr("placeholder", "Post message as '" + name + "'");
}


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
$("#channel-name").fitText(1.2);


// Stuff to do after the window loads
// Only need to include stuff that requires elements in the window
$(window).load(function(){
    resetParentDimensions();

    $(".timeline-container").hide();

    largestPostNumber = parseInt($(".chat-row .postNumber").last().text());
    smallestPostNumber = parseInt($(".chat-row .postNumber").first().text());
    setTimeline();

    hideAndSeek();
});



