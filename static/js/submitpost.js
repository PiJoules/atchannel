
// Update the hidden date input every second
$("#date").val(Date.now);
setInterval(function(){
	$("#date").val(Date.now);
}, 1000);

var content = "";

$("#post-markdown").markdown({
	onChange: function(e){
		content = e.getContent();
	}
});

$("form.post").submit(function(event){
	event.preventDefault(); // don't refresh page

	var inputs = $(this).serializeArray(); // for some reason, returns an array of objects
	var formObj = {};
	for (var i = 0; i < inputs.length; i++)
		formObj[inputs[i].name] = inputs[i].value;

	if (formObj["g-recaptcha-response"] === ""){
		alert("Please prove you are human.");
		return;
	}

    if (content !== "" && formObj["name"] !== "" && formObj["channel"] !== ""){
        $.post("/addPost", formObj).done(function(response){
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