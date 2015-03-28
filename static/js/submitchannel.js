$("#new-channel-name").keyup(function(e){
    $(".new-channel-name").text($("#new-channel-name").val().trim() + "Channel");
	$(".welcome-message").textfill({
		maxFontPixels: 63
	});
});

$(window).load(function(){
	$(".welcome-message").textfill({
		maxFontPixels: 63
	});
});



// Update the hidden date input every second
$("#date").val(Date.now);
setInterval(function(){
	$("#date").val(Date.now);
}, 1000);

var content = "";

$("#channel-markdown").markdown({
	onChange: function(e){
		content = e.getContent();
		$(".channel-description").html(e.parseContent());
	},
});

$("form.channel").submit(function(event){
	event.preventDefault(); // don't refresh page

	var inputs = $(this).serializeArray(); // for some reason, returns an array of objects
	var formObj = {};
	for (var i = 0; i < inputs.length; i++)
		formObj[inputs[i].name] = inputs[i].value;
    /**
     * Will include channel, description, time, and captcha
     */

	if (formObj["g-recaptcha-response"] === ""){
		alert("Please prove you are human.");
		return;
	}

    if (content !== "" && formObj["channel"] !== ""){
        $.post("/addChannel", formObj, function(response){
            console.log(response);
            if (response !== ""){
                alert(response);
                location.reload();
            }
            else {
                // success
                window.location.href = "/" + formObj.channel;
            }
        }).fail(function(jqXHR, textStatus, errorThrown){
            alert([textStatus, errorThrown]);
        });
    }
});

