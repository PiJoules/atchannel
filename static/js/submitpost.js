
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
            translatedContent = translateTags(content);
            $("#tags").val(JSON.stringify(getTags(content)));
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

    console.log(formObj);
    //return;

	/*if (formObj["g-recaptcha-response"] === ""){
		alert("Please prove you are human.");
		return;
	}*/

    //if (content !== "" && formObj["name"] !== "" && formObj["channel"] !== ""){
        $.post("/addPost", formObj, function(response){
            console.log(JSON.stringify(response));
            if (response !== ""){
                //alert(response);
                //location.reload();
            }
            else {
                // success
                //window.location.href = "/" + formObj.channel;
            }
        }).fail(function(jqXHR, textStatus, errorThrown){
            alert([textStatus, errorThrown]);
        });
    //}
});

var regex = /<(\d+)@([A-Za-z0-9]+)>/g; // DON;T FORGET THIS G !!!!

function getTags(content){
    var tags = [];
    var match;
    while (match = regex.exec(content)){
        tags.push({ "postNumber": match[1], "channel": match[2]});
    }
    return tags;
}

function translateTags(content){
    return content.replace(regex, '[<$1@$2>](/$2/$1)');
}