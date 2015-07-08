if (Meteor.isClient) {
  Template.redirect.rendered = function(){
      window.location.href = "http://atchannel.space/";
  };
}
