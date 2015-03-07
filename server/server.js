

// Limit user privelages to just posting
Meteor.methods({
    addPost: function (messageObject) {
        messageObject["postNumber"] = incrementCounter(messageObject.channel);
        Messages.insert(messageObject);
    }
});
