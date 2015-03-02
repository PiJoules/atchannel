

/**
 * Globals
 */

var messagesArray;
var chatrowsAreSetup = false;

// Because botDist measures dist from top of elem to bottom,
// add a buffer to allow for elems coming from bottom to be invisible more
var bottomBuffer = 30; // decrease to shift the bump down; increase to move it up
var buffer = 50;
var w = 90;
var pt, ph, mid;
var limit = 100.0;

var maxProperties = {
    "font-size": "15px",
    "bubbleWidth": "100%",
    "margin-left": "5%",
    "margin-right": "5%",
    "avatarWidth": "5%",
    "time-font-size": "12px"
};
var defaultProperties = {
    "font-size": "1.5px",
    "bubbleWidth": "10%",
    "margin-left": "15%",
    "margin-right": "15%",
    "avatarWidth": "2%",
    "time-font-size": "1.5px"
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


/**
 * Router
 */
Router.route('/', function() {
    this.render('home');
});
Router.route('/could-not-find',function(){
    this.render("redirect-template");
});
Router.route('/redirect/main',function(){
    this.redirect("/");
    location.reload();
});
Router.route('/redirect/:channel',function(){
    var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
    if (channels.indexOf(channel) === -1){
        this.redirect("could-not-find");
    }
    else{
        this.redirect("/" + this.params.channel);
        location.reload();
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
        messagesArray = messages.fetch();

        tryToSetupHideAndSeek();

        return messages;
    }
});

Template.chatrow.created = function () {
    // Put something here for when the chatrow is first created
};

Template.chatrow.rendered = function () {
    pt = $(".chat").position().top; // parent top
    ph = $(".chat").height(); // parent height
    mid = pt + ph/2 - bottomBuffer;

    $(window).resize(function(){
        pt = $(".chat").position().top; // parent top
        ph = $(".chat").height(); // parent height
        mid = pt + ph/2 - bottomBuffer;
    });

    $(".filler-row").height(mid + "px");

    $(".chat").scroll(function(){
        hideAndSeek();
    });

    hideAndSeek = function(){
        $(".chat-row").each(function(index){
            hidingFunction(index, this);
        });
    };

    post = function(){
        if ($("#message").val().trim() !== ""){
            Messages.insert({
                name: name,
                message: $("#message").val().trim(),
                time: Date.now(),
                channel: channel
            });

            $("#message").val("");

            $(".chat").animate({
                scrollTop: $(".chat")[0].scrollHeight
            }, "fast", function(){
                $(".postNumber").each(function(index){
                    $(this).text((index+1));
                });
            });
        }
    };

    $("#post").click(function(){
        post();
    });

    $("#submit-username").click(function(){
        var input = $("#selected-user-name").val().trim();
        if (input !== "" && isAlphaNumeric(input)){
            name = input;
            $(".username").text(name);
            $("#myModal").modal("hide");
        }
        else if (!isAlphaNumeric(input)){
            alert("Please enter alphanumeric characters only");
        }
    });
    $('#myModal').modal();

    $("#about-modal-revealer").click(function(){
        $("#aboutModal").modal();
    });

    $("#existing-channels-revealer").click(function(){
        $("#existing-channels").modal();
    });

    $("#creating-channel-revealer").click(function(){
        $("#creating-channel").modal();
    });

    $("#submit-channel").click(function(){
        var channelName = $("#new-channel-name").val().trim();
        if (channelName !== "" && isAlphaNumeric(channelName)){
            Messages.insert({
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
    });

    if (channel !== "main"){
        $("#channel-name").text(channel + "Channel");
    }

    tryToSetupHideAndSeek();
};

Template.chatrow.destroyed = function () {
    chatrowsAreSetup = false;
};

Template.input.events = {
    'keydown input#message' : function (event) {
        if (event.which == 13) { // 13 is the enter key event
            post();
        }
    }
};

Template.channels.helpers({
    channels: function() {
        // Return each distinct channel name
        var channels = _.uniq(Messages.find({}, { channel: 1 }).map(function(x) {return x.channel;}), true);
        channels.splice(channels.indexOf("main"), 1);
        return channels;
    }
});


/**
 * Custom helpers
 */

// Make the date number something human-readadble
Handlebars.registerHelper("prettifyTime", function(timestamp) {
    var dateObj = new Date(timestamp);
    return new Date(timestamp).toLocaleString();
});

// Return a random id because the @channel has ids
Handlebars.registerHelper("chopID", function() {
    return (new Date().getTime() * Math.random() * Math.pow(10,9)).toString(36).substring(0,9);
});



function tryToSetupHideAndSeek(){
    try{
        hideAndSeek();
        $(".chat").animate({
            scrollTop: $(".chat")[0].scrollHeight
        }, "slow", function(){
            $(".postNumber").each(function(index){
                $(this).text((index+1));
            });
            chatrowsAreSetup = true;
        });
    }
    catch(err){

    }
}


// Function for controlling the resizing and reformatting of the size of each chat row
function hidingFunction(index, that){

    // Track distance between each initial top position and
    // original center of screen. If the distance is greater than
    // a specified fraction of the screen height, make it disappear
    var midDist = Math.abs($(that).position().top - mid);

    if (midDist > limit+buffer){
        changeRow(that);
    }
    else if (midDist < buffer) {
        changeRow(that,maxProperties);
    }
    else {
        /*
        # NOTES
        font size: (15-1.5)/(0-limit)*midDist + 15
        bubbleWidth: (100-10)/(0-limit)*midDist + 100
        margin-left: (5-15)/(0-limit)*midDist + 5
        margin-right: (5-15)/(0-limit)*midDist + 5
        avatar: (5-2)/(0-limit)*midDist + 5

        15 = -14.5/limit*buffer + yIndex
        yIndex = 15 + 14.5/limit*buffer
        font-size = 15 + 14.5/limit*buffer + 14.5/limit*(-midDist)
                  = 14.5/limit*(buffer-midDist) + 15

        property = (max-default)/limit*(midDist-buffer) + max
        */
        var properties = {
            "font-size": (-14.5/limit*(midDist-buffer) + 15) + "px",
            "bubbleWidth": (-90/limit*(midDist-buffer) + 100) + "%",
            "margin-left": (10/limit*(midDist-buffer) + 5) + "%",
            "margin-right": (10/limit*(midDist-buffer) + 5) + "%",
            "avatarWidth": (-3/limit*(midDist-buffer) + 5) + "%",
            "time-font-size": (-10.5/limit*(midDist-buffer) + 12) + "px"
        };
        changeRow(that, properties);
    }

    if (typeof $(that).data("color") === "undefined"){
        var color = randElem(colors);
        $(that).data("color", color);
        $(that).find(".bubble").css("background-color", color.replace("n","")).addClass(color.replace("#",""));
    }

}

// Function for resizing a row
function changeRow(that, properties){
    var nextProperties = $.extend({}, defaultProperties, properties);
    $(that).css({
        "font-size": nextProperties["font-size"],
        "margin-left": nextProperties["margin-left"],
        "margin-right": nextProperties["margin-right"]
    });
    $(that).find(".bubble").css({
        "width": nextProperties["bubbleWidth"]
    });
    $(that).find(".avatar").css({
        "width": nextProperties["avatarWidth"]
    });
    $(that).find(".time").css({
        "font-size": nextProperties["time-font-size"]
    });
}


function randElem(array){
    return array[Math.floor(Math.random()*array.length)];
}


function isAlphaNumeric(input){
    return !/[^a-zA-Z0-9]/.test(input);
}
