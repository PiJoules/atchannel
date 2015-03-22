/**
 * Replicate the YUI module pattern to reduce the number of globals because I'm a scrub who can't code
 * 
 * http://stackoverflow.com/questions/2613310/ive-heard-global-variables-are-bad-what-alternative-solution-should-i-use
 * 
 * var FOO = (function() {
 *	    var my_var = 10; //shared variable available only inside your module
 *
 *	    function bar() { // this function not available outside your module
 *	        alert(my_var); // this function can access my_var
 *	    }
 *
 *	    return {
 *	        a_func: function() {
 *	            alert(my_var); // this function can access my_var
 *	        },
 *	        b_func: function() {
 *	            alert(my_var); // this function can also access my_var
 *	        }
 *	    };
 *
 *	})();
 */

var atchannel = (function(){

	var md = new MobileDetect(window.navigator.userAgent);


	// Username
	var usernameKey = "atchannelUsername";
	var username = localStorage.getItem(usernameKey) || "Anonymous";
	var usernameCallback;


	// Styles
	var styles = {
	    "anime": 1,
	    "vn": 2
	};
	var styleKey = "atchannelStyle";
	var currentStyle;
	var setStyle = function(nextStyle){
		currentStyle = nextStyle;
		localStorage.setItem(styleKey, currentStyle);
	};
	var styleCallback; // called after setStyle is called with the style as the parameter
	if (localStorage.getItem(styleKey) === null){
	    if (md.mobile()){
			setStyle(styles.vn);
	    }
	    else {
			setStyle(styles.anime);
	    }
	}
	else {
	    setStyle(parseInt(localStorage.getItem(styleKey)));
	}


	// Animation
	var animateKey = "atchannelAnimate";
	var animate;
	var setAnimate = function(nextAnimate){
		animate = nextAnimate;
		localStorage.setItem(animateKey, animate);
	};
	var animateCallback; // called after setAnimate is called with animate as the parameter
	if (md.mobile()){
	    setAnimate(false);
	}
	else if (localStorage.getItem(animateKey) === null){
	    setAnimate(currentStyle === styles.anime);
	}
	else {
	    setAnimate(localStorage.getItem(animateKey) === "true" ? true : false);
	}


	var isAlphaNumeric = function(input){
	    return !/[^a-zA-Z0-9]/.test(input);
	}


	/**
	 * return the stuff that any page can access
	 */
	return {
		md: md,
		styles: styles,

		getUsername: function(){
			return username;
		},
		setUsername: function(nextUsername){
			username = nextUsername;
			localStorage.setItem(usernameKey, username);
			if (typeof usernameCallback !== "undefined"){
				usernameCallback(username);
			}
		},
		setUsernameCallback: function(callback){
			usernameCallback = callback;
		},

		getStyle: function(){
			return currentStyle;
		},
		setStyle: function(style){
			setStyle(style);
			if (typeof styleCallback !== "undefined"){
				styleCallback(style);
			}
		},
		setStyleCallback: function(callback){
			styleCallback = callback;
		},
		isAnimeStyle: function(){
			return currentStyle === styles.anime;
		},
		isVNStyle: function(){
			return currentStyle === styles.vn;
		},
		setAnimeStyle: function(shouldSetAnime){
			if (shouldSetAnime)
				currentStyle = styles.anime;
			else
				currentStyle = styles.vn;
		},

		canAnimate: function(){
			return animate;
		},
		setAnimate: function(nextAnimate){
			setAnimate(nextAnimate);
			if (typeof animateCallback !== "undefined"){
				animateCallback(nextAnimate);
			}
		},
		setAnimateCallback: function(callback){
			animateCallback = callback;
		},

		submitChannel: function(channel, successCallback){
			channel = channel.trim();
			if (channel !== "" && isAlphaNumeric(channel)){
			    $.post("/addChannel", {channel: channel}).done(function(response){
			        if (response !== ""){
			            alert(response);
			        }
			        else {
			        	// success
			        	if (typeof successCallback !== "undefined")
			        		successCallback();
			        }
			    }).fail(function(jqXHR, textStatus, errorThrown){
			        alert([textStatus, errorThrown]);
			    });
			}
			else {
				alert("Please enter alphanumeric characters only");
			}
		},

		// Some micellanious functions
		isAlphaNumeric: isAlphaNumeric,
		randElem: function(array){
			return array[Math.floor(Math.random()*array.length)];
		},
	}

})();