/**
* Models
*/
Messages = new Meteor.Collection('messages');

// Limit user privelages to just posting
Meteor.methods({
    addPost: function (messageObject) {
        Messages.insert(messageObject);
    }
});
