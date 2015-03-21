

var md = new MobileDetect(window.navigator.userAgent);

var name = 'Anonymous';
var currentRow = 1;
var styles = Object.freeze({
    "anime": 1,
    "vn": 2
}); // use freeze to prevent object from changing

var currentStyle;
if (sessionStorage.getItem("style") === null){
    if (md.mobile()){
        setStyle(styles.vn);
    }
    else {
        setStyle(styles.anime);
    }
}
else {
    setStyle(parseInt(sessionStorage.getItem("style")));
}

var canAnimate;
if (md.mobile()){
    setCanAnimate(false);
}
else if (sessionStorage.getItem("canAnimate") === null){
    setCanAnimate(currentStyle === styles.anime);
}
else {
    setCanAnimate(sessionStorage.getItem("canAnimate") === "true" ? true : false);
}