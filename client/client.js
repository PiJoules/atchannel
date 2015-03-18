

/**
 * Resizing Globals
 */

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50; // distance from mid (either above or below)
var pt, ph, mid;
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
var intervalID, messagesCount = 0;
var hidingFunctionIntervalID;
var nextAmount = 50;
var smallestPostNumber = 0;
var largestPostNumber = 0;
var justSentPost = false;
var justLoadedMore = false;


// add n so can be used ass class
var colors = [
    "#bbffff", // light blue
    "#b694da", // some purple
    "#bde0b1", // light green
    "#a0e1b4", // darker green
    "#a63333", // reddish
    "#d090c4", // pinkish
    "#fffed9", // yellowish,
    "#ffd39b", // lighty orange
    "n#74bbfb", // darker blue
];


/**
 * Page Globals
 */
var name = 'Anonymous';
var channel = "main";
var currentRow = 1;
var styles = Object.freeze({
    "anime": 1,
    "vn": 2
}); // use freeze to prevent object from changing


var currentStyle;
if (sessionStorage.getItem("style") === null){
    if (Meteor.Device.isTablet() || Meteor.Device.isPhone()){
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
 * Router
 *
 * Use /redirect/:channel for reloading the page after redirecting to it
 * since just redirecting to it doesn't actually render the template for some reason
 */

Router.route('/', function() {
    this.render('home');
});
Router.route('/could-not-find',function(){
    this.render("redirect-template");
});
Router.route('/redirect/main',function(){
    window.location.replace("/");
});
Router.route('/redirect/:channel',function(){
    var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
    if (channels.indexOf(channel) === -1){
        this.redirect("could-not-find");
    }
    else{
        window.location.replace("/" + this.params.channel);
    }
});
Router.route('/:channel', function() {
    channel = this.params.channel;
    var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
    if (channels.indexOf(channel) === -1){
        this.render("redirect-template");
    }
    else{
        this.render('home');
    }
});


/**
 * Templates
 */

Session.set("skip", 0);
Session.set("limit", nextAmount);
Template.chatrow.helpers({
    // can return either the collection or the array of objects
    messages: function() {
        var count = Count.findOne({_id: channel});
        if (typeof count === "undefined")
            return [];
        var messages = Messages.find({channel: channel, postNumber: { $gt: count.seq-Session.get("limit") }}, { sort: {postNumber: 1} });
        
        var messagesArray = messages.fetch();
        messagesCount = messagesArray.length;

        if (messagesCount > 0){
            smallestPostNumber = messagesArray[0].postNumber;
            largestPostNumber = Math.max(messagesArray[messagesArray.length-1].postNumber, largestPostNumber);
            setTimeline();

            if ($(".chat").length > 0 && $(".chat-row").length > 1 && !justSentPost && justLoadedMore){
                scrollToPost(Math.min(nextAmount, messagesCount), hideAndSeek);
            }

            if (typeof $(".chat-row").last().data("postnumber") === "undefined" || parseInt($(".chat-row").last().data("postnumber")) !== largestPostNumber){

                    function hidingFunctionIntervalTrigger(){
                        return window.setInterval(function(){
                            if (parseInt($(".chat-row").last().data("postnumber")) === largestPostNumber){
                                hideAndSeek();
                                window.clearInterval(hidingFunctionIntervalID);
                            }
                        }, 100);
                    }
                    hidingFunctionIntervalID = hidingFunctionIntervalTrigger();

            }

            if (messagesCount < nextAmount || smallestPostNumber === 1){
                $(".load-prev").parent().hide();
            }
            else {
                $(".load-prev").parent().show();
            }
        }
        else {
            $(".load-prev").parent().hide();
        }

        justSentPost = false;
        justLoadedMore = false;

        return messagesArray;
    }
});

Template.home.rendered = function () {

    switchDesigns(currentStyle);
    $(".design-switch").click(function(){
        switchDesigns();
    });

    resetParentDimensions();

    $(window).resize(function(){
        resetParentDimensions();
        setTimeline();
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

    $(".filler-row").height(mid + "px");

    $(".chat").scroll(function(){
        hideAndSeek();
        markTimeline();
    });

    $("#submit-username").click(function(){
        var input = $("#selected-user-name").val().trim();
        if (input !== "" && isAlphaNumeric(input)){
            name = input;
            localStorage.atchannelUsername = name;
            $(".message").attr("placeholder", "Post message as '" + name + "'");
            $("#myModal").modal("hide");
        }
        else if (!isAlphaNumeric(input)){
            alert("Please enter alphanumeric characters only");
        }
    });

    if (localStorage.getItem("atchannelUsername") === null){
        $('#myModal').modal();
    }
    else{
        name = localStorage.atchannelUsername;
        $(".message").attr("placeholder", "Post message as '" + name + "'");
    }

    $("#new-channel-name").keyup(function(){
        $(".new-channel-name").text($("#new-channel-name").val().trim() + "Channel");
    });

    $("#submit-channel").click(function(){
        var channelName = $("#new-channel-name").val().trim();
        var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
        if (channelName !== "" && isAlphaNumeric(channelName) && channels.indexOf(channelName) === -1){
            Meteor.call("addPost",{
                name: "Channel Creator",
                message: channelName + "Channel is now open",
                time: Date.now(),
                channel: channelName
            });
            Router.go("/redirect/" + channelName);
        }
        else if (!isAlphaNumeric(channelName)){
            alert("Please enter alphanumeric characters only");
        }
        else if (channels.indexOf(channelName) !== -1){
            alert("This channel already exists. Please choose a different name.");
        }
    });

    $(".chat-input .prevPost").click(function(){
        scrollToPrevPost();
    });
    $(".chat-input .nextPost").click(function(){
        scrollToNextPost();
    });

    $(".load-prev").click(function(){
        justLoadedMore = true;
        Session.set("limit", Session.get("limit")+nextAmount);
    });

    if (channel !== "main"){
        $("#channel-name").text(channel + "Channel");
    }

    $(".message").keyup(function(e){
        if(e.keyCode == 13) {
            post();
        }
    });

    if (messagesCount < nextAmount || smallestPostNumber === 1){
        $(".load-prev").parent().hide();
    }
    else {
        $(".load-prev").parent().show();
    }

    if ($(".chat-row").length > 1 && $(".chat-row").length-1 === messagesCount){
        tryToSetupHideAndSeek();
    }
    else {
        function intervalTrigger(){
            return window.setInterval(function(){
                if ($(".chat-row").length > 1 && $(".chat-row").length-1 === messagesCount){
                    tryToSetupHideAndSeek();
                    window.clearInterval(intervalID);
                }
            }, 1000);
        }
        intervalID = intervalTrigger();
    }

};

Template.channels.helpers({
    channels: function() {
        // Return each distinct channel name
        var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
        var uniqueChannels = [];
        $.each(channels, function(index, element){
            if($.inArray(element, uniqueChannels) === -1 && element !== "main")
                uniqueChannels.push(element);
        });
        return uniqueChannels;
    }
});


/**
 * Custom helpers
 */

// Make the date number something human-readadble
Handlebars.registerHelper("prettifyTime", function(timestamp) {
    return prettifyTime(timestamp);
});

// Return a random id because the @channel has ids
Handlebars.registerHelper("chopID", function() {
    return chopID();
});

Handlebars.registerHelper("randPic", function() {
    return randPic();
});



/**
 * Miscellanious functions
 */
function post(){
    if ($(".message").val().trim() !== ""){
        justSentPost = true;

        Meteor.call("addPost",{
            name: name,
            message: $(".message").val().trim(),
            time: Date.now(),
            channel: channel
        });

        $(".message").val("");

        $(".chat").animate({
            scrollTop: $(".chat")[0].scrollHeight
        }, "fast", function(){
            if (currentStyle === styles.anime){
                $(".chat-row").each(function(index){
                    if (typeof $(this).data("color") === "undefined"){
                        var color = randElem(colors);
                        $(this).data("color", color);
                        $(this).find(".bubble").css("background-color", color.replace("n","")).addClass(color.replace("#",""));
                    }
                });
            }
        });
    }
}

function tryToSetupHideAndSeek(){
    try{
        hideAndSeek();
        $(".chat").animate({
            scrollTop: $(".chat")[0].scrollHeight
        }, "slow", function(){
            setTimeline();
            markTimeline($(".timeline li").length-1);
        });
    }
    catch(err){

    }
}


function hideAndSeek(){
    if (currentStyle === styles.anime){
        // limit the rows to resize only to those onscreen
        var rows = $(".chat-row").filter(function(index){
            return $(this).position().top+$(this).outerHeight() > 0 && $(this).position().top < ph;
        });
        changeRow($(".chat-row").not(rows));
        rows.each(function(index){
            hidingFunction(index, $(this));

            // Set color of pointer
            if (typeof $(this).data("color") === "undefined"){
                var color = randElem(colors);
                $(this).data("color", color);
                $(this).find(".bubble").css("background-color", color.replace("n","")).addClass(color.replace("#",""));
            }
        });
    }
}


// Function for controlling the resizing and reformatting of the size of each chat row
function hidingFunction(index, that){

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

// Function for resizing a row
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


function randElem(array){
    return array[Math.floor(Math.random()*array.length)];
}


function isAlphaNumeric(input){
    return !/[^a-zA-Z0-9]/.test(input);
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

function scrollToPost(i,callback){
    try {
        $(".chat").animate({
            scrollTop: $(".chat").scrollTop() + $(".chat-row:eq(" + i + ")").position().top - ph/2
        }, "fast", function(){
            if (typeof callback !== "undefined"){
                callback(i);
            }
        });
    }
    catch (err){

    }
}

function setTimeline(){
    if (currentStyle === styles.anime){
        var ticHeight = 30; // the height of each li element in px
        var ticCount = parseInt(ph/ticHeight)+1;
        //var postGap = parseFloat( ($(".chat-row").length-1)/ticCount );
        var postGap = parseFloat( (largestPostNumber-smallestPostNumber+1)/ticCount );
        $(".timeline").empty();
        var lastNumber = 0;
        for (var i = 0; i < ticCount; i++){
            var index = Math.ceil(postGap*i)+1;

            // ensure no duplicate numbers are shown
            if (index !== lastNumber)
                $(".timeline").append("<li><a href='javascript: void(0)' data-index='" + index + "'>" + (index+smallestPostNumber) + "</a> -</li>");

            lastNumber = index;
        }
        markTimeline();
        $(".timeline a").click(function(){
            var index = parseInt($(this).data("index"));
            // RECURSION B*TCH !!!!!!
            var checkingFunction = function(index){
                if (index > currentRow){
                    scrollToPost(index++, checkingFunction);
                }
                else if (index < currentRow){
                    scrollToPost(index--, checkingFunction);
                }
                else {
                    markTimeline();
                }
            };
            checkingFunction(index);
        });
    }
}


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


function resetParentDimensions(){
    pt = $(".chat").position().top; // parent top
    ph = $(".chat").height(); // parent height
    mid = pt + ph/2 - bottomBuffer;
}

// Add zero to the beginning of a single digit number to get a 2 digit one
function zeroify(num){
    return num < 10 ? '0' + num : num;
}

function prettifyTime(timestamp){
    
    var date = new Date(timestamp);
    // yyyy/mm/dd (Day)  hh:mm:ss
    // hh is from 00-23
    return date.getFullYear() + "/" + zeroify(date.getMonth()+1) + "/" + zeroify(date.getDate()) + " (" + ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()] + ") " + zeroify(date.getHours()) + ":" + zeroify(date.getMinutes()) + ":" + zeroify(date.getSeconds());
}

function chopID(){
    return (new Date().getTime() * Math.random() * Math.pow(10,9)).toString(36).substring(0,9);
}

function randPic(){
    var faceNum = Math.floor(Math.random()*4)+1;
    return "face" + faceNum + ".png";
}

function setStyle(style){
    sessionStorage.setItem("style", style);
    currentStyle = style;

    // stuff to do after changing the styles
    if (style === styles.anime){
        hideAndSeek();
        $(".chat").animate({
            scrollTop: 1
        }, 100, function(){
            setTimeline();
            markTimeline($(".timeline li").length-1);
        });
    }
    else if (style === styles.vn){
        $(".chat-row:gt(0) *").removeAttr("style");
        $(".chat-row:gt(0)").removeAttr("style").removeData("color").find(".bubble").removeClass().addClass("bubble");
    }
}

function switchDesigns(style){
    if (typeof style === "undefined"){
        if ($("body").hasClass("anime")){
            $("body").removeClass("anime").addClass("vn");
            $(".design-switch").text("Switch to Anime design");
            setStyle(styles.vn);
        }
        else {
            $("body").removeClass("vn").addClass("anime");
            $(".design-switch").text("Switch to VN design");
            setStyle(styles.anime);
        }
    }
    else if (style === styles.anime) {
        $("body").removeClass("vn").addClass("anime");
        $(".design-switch").text("Switch to VN design");
        setStyle(style);
    }
    else if (style === styles.vn){
        $("body").removeClass("anime").addClass("vn");
        $(".design-switch").text("Switch to Anime design");
        setStyle(style);
    }
}