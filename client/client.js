
/**
 * NOTES
 * 
 */


/**
 * Globals
 */

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50; // distance from mid (either above or below)
var pt, ph, mid;
var limit = 100.0; // distance from mid at which to start resizing

var intervalID, messagesCount = 0;
var currentCount = 0;
var nextAmount = 25;

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

var name = 'Anonymous';
var channel = "main";
var currentRow = 1;


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

Template.chatrow.helpers({
    messages: function() {
        var messages = Messages.find({channel: channel}, { sort: { time: 1}});
        messagesCount = messages.fetch().length;
        console.log("received messages: " + messages.count());
        /**
         * ISSUES!!!
         * Posting on one machine does not reformat the chat-row on another machine
         */
        //hideAndSeek();
        tryToSetupHideAndSeek();
        return messages;
    }
});

Template.home.rendered = function () {
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
            $("#message").attr("placeholder", "Post message as '" + name + "'");
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
        $("#message").attr("placeholder", "Post message as '" + name + "'");
    }

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

    if (channel !== "main"){
        $("#channel-name").text(channel + "Channel");
    }

    $("#message").keyup(function(e){
        if(e.keyCode == 13) {
            post();
        }
    });

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

    console.log("rendered page");
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
    if ($("#message").val().trim() !== ""){
        Meteor.call("addPost",{
            name: name,
            message: $("#message").val().trim(),
            time: Date.now(),
            channel: channel
        });

        $("#message").val("");

        $(".chat").animate({
            scrollTop: $(".chat")[0].scrollHeight
        }, "fast", function(){
            $(".chat-row").each(function(index){
                if (typeof $(this).data("color") === "undefined"){
                    var color = randElem(colors);
                    $(this).data("color", color);
                    $(this).find(".bubble").css("background-color", color.replace("n","")).addClass(color.replace("#",""));
                }
            });
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
            markTimeline($("#timeline li").length-1);
            $(".chat-row").each(function(index){
                // Wrap any URLs in A tags, but keep rest of message as text
                // (https?:\/\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\/[-a-z\\d%_.~+\@]*)*(\\?[;&a-z\\d%_.~+=-]*)?(\\#[-a-z\\d_]*)?
                var regex = new RegExp( '(https?:\\/\\/)?'+ // protocol
                                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                                        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+\@]*)*'+ // port and path
                                        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                                        '(\\#[-a-z\\d_]*)?', 'ig');
                var message = $(this).find(".message").text();
                var newElements = [];
                var lastIndex = 0;
                while (match=regex.exec(message)) {
                    var url = message.substr(match.index, match[0].length);
                    newElements.push( document.createTextNode(message.substring(lastIndex, match.index)) );
                    newElements.push($("<a href='" + url + "' target='_blank'>" + url + "</a>"));
                    lastIndex = match.index + match[0].length;
                }
                newElements.push( document.createTextNode(message.substring(lastIndex)) );
                $(this).find(".message").empty().append(newElements);
            });
        });
    }
    catch(err){
        console.log("could not setup hideAndSeek: " + err);
    }
}


function hideAndSeek(){
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
    that.find(".time").css({
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
    $(".chat").animate({
        scrollTop: $(".chat").scrollTop() + $(".chat-row:eq(" + i + ")").position().top - ph/2
    }, "fast", function(){
        if (typeof callback !== "undefined"){
            callback(i);
        }
    });
}

function setTimeline(){
    var ticHeight = 30; // the height of each li element in px
    var ticCount = parseInt(ph/ticHeight)+1;
    var postGap = parseFloat( ($(".chat-row").length-1)/ticCount );
    $("#timeline").empty();
    var lastNumber = 0;
    for (var i = 0; i < ticCount; i++){
        var index = Math.ceil(postGap*i)+1;

        // ensure the line doesn't go past the total number of posts
        if (index > $(".chat-row").length-1)
            break;

        // ensure no duplicate numbers are shown
        if (index !== lastNumber)
            $("#timeline").append("<li><a href='javascript: void(0)' data-index='" + index + "'>" + index + "</a> -</li>");

        lastNumber = index;
    }
    markTimeline();
    $("#timeline a").click(function(){
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


function markTimeline(index){
    if (typeof index === "undefined"){
        if ($("#timeline a[data-index='" + currentRow + "']").length > 0){
            $("#timeline li").css("background-color", "initial");
            $("#timeline a[data-index='" + currentRow + "']").parent().css("background-color", "#abdfde");
        }
    }
    else {
        $("#timeline li").css("background-color", "initial");
        $("#timeline li:eq(" + index + ")").css("background-color", "#abdfde");
    }
}


function resetParentDimensions(){
    pt = $(".chat").position().top; // parent top
    ph = $(".chat").height(); // parent height
    mid = pt + ph/2 - bottomBuffer;
}

function prettifyTime(timestamp){
    return new Date(timestamp).toLocaleString();
}

function chopID(){
    return (new Date().getTime() * Math.random() * Math.pow(10,9)).toString(36).substring(0,9);
}

function randPic(){
    var faceNum = Math.floor(Math.random()*4)+1;
    return "face" + faceNum + ".png";
}
