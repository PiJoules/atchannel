/**
 * Channel submission
 */
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
function submitChannel(){
    var channelName = $("#new-channel-name").val().trim()
    atchannel.submitChannel(channelName, function(){
        window.location.replace("/" + channelName);
    });
}


// Design toggle
$("input.toggle-style").bootstrapSwitch({
    onText: "Anime",
    offText: "VN",
    state: atchannel.isAnimeStyle(),
    onSwitchChange: function(event, state){
        if (state){
            atchannel.setStyle(atchannel.styles.anime);
            if (!atchannel.isMobile())
                $("input.toggle-resize").bootstrapSwitch("disabled", false);
        }
        else {
            atchannel.setStyle(atchannel.styles.vn);
            $("input.toggle-resize").bootstrapSwitch("disabled", true);
        }
    }
});


// Toggle resize animation
$("input.toggle-resize").bootstrapSwitch({
    state: atchannel.canAnimate(),
    disabled: (atchannel.isVNStyle() || atchannel.isMobile()),
    onSwitchChange: function(event, state){
        atchannel.setAnimate(state);
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
function setUsername(){
    var username = $("#selected-user-name").val().trim();
    if (username === ""){
        alert("Invalid username: " + username);
    }
    else {
        atchannel.setUsername(username);
        $(".username").not("input").text(username);
        $("input[type=text].username").val(username);
    }
}
$(".username").not("input").text(atchannel.getUsername());
$("input[type=text].username").val(atchannel.getUsername());


