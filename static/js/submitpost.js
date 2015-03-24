
// Update the hidden date input every second
$("#date").val(Date.now);
setInterval(function(){
	$("#date").val(Date.now);
}, 1000);

var content = "";
var translatedContent = "";
var previewing = false;
var enteredPreview = false;

$("#post-markdown").markdown({
    onPreview: function(e){
        if (!enteredPreview){
            enteredPreview = true;
            e.setContent(translatedContent);
        }
    },
	onChange: function(e){
        if (enteredPreview){
            previewing = true;
            enteredPreview = false;
        }
        else if (previewing){
            // left preview mode
            e.setContent(content);
            previewing = false;
        }
        else {
            // changed something in editor
            content = e.getContent();
            translatedContent = atchannel.translateTags(content);

            var tags = atchannel.uniq_fast( atchannel.getTags(content) );
            $("#tags").val(JSON.stringify(tags));
            $(".tags").text(tags.join(", ") || "None");
        }
	},
});

$("form.post").submit(function(event){
	event.preventDefault(); // don't refresh page

	var inputs = $(this).serializeArray(); // for some reason, returns an array of objects
	var formObj = {};
	for (var i = 0; i < inputs.length; i++)
		formObj[inputs[i].name] = inputs[i].value;
    formObj.message = content;

	if (formObj["g-recaptcha-response"] === ""){
		alert("Please prove you are human.");
		return;
	}

    if (content !== "" && formObj["name"] !== "" && formObj["channel"] !== ""){
        $.post("/addPost", formObj, function(response){
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




