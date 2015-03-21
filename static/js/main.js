

/**
 * Resizing Globals
 */

var md = new MobileDetect(window.navigator.userAgent);

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50; // distance from mid (either above or below)
var pt, ph, mid; // parent dimensions
var limit = 100.0; // distance from mid at which to start resizing

var maxPropertiesNumeric;
if (md.mobile()){
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


/**
 * Page Globals
 */
var name = 'Anonymous';
var currentRow = 1;
var styles = Object.freeze({
    "anime": 1,
    "vn": 2
}); // use freeze to prevent object from changing

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
    setStyle(parseInt(sessionStorage.getItem("style")));
}

var canAnimate;
if (md.mobile()){
    setCanAnimate(false);
}
else if (sessionStorage.getItem("canAnimate") === null){
    setCanAnimate(currentStyle === styles.anime);
}
else {
    setCanAnimate(sessionStorage.getItem("canAnimate") === "true" ? true : false);
}

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
    if (!canAnimate){
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
$(".fit-text").fitText(1.2);


// Design toggle
$("input.toggle-style").bootstrapSwitch({
    onText: "Anime",
    offText: "VN",
    state: (currentStyle === styles.anime),
    onSwitchChange: function(event, state){
        if (state){
            // Anime
            setStyle(styles.anime);
            if (!md.mobile())
                $("input.toggle-resize").bootstrapSwitch("disabled", false);
        }
        else {
            // VN
            setStyle(styles.vn);
            if (!md.mobile())
                $("input.toggle-resize").bootstrapSwitch("disabled", true);
        }
    }
});


// Toggle resize animation
$("input.toggle-resize").bootstrapSwitch({
    state: canAnimate,
    disabled: (currentStyle !== styles.anime || md.mobile()),
    onSwitchChange: function(event, state){
        setCanAnimate(state);
    }
});


// Stuff to do after the window loads
// Only need to include stuff that requires elements in the window
$(window).load(function(){
    resetParentDimensions();

    if ( ($(".chat").scrollTop() <= 50 && $(window).scrollTop() <= 50) || window.innerWidth <= 880)
        $(".timeline-container").hide();

    largestPostNumber = parseInt($(".chat-row .postNumber").last().text());
    smallestPostNumber = parseInt($(".chat-row .postNumber").first().text());
    setTimeline();

    hideAndSeek();
});



