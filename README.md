# [@channel](http://atchannel.space/)
The goal of this website is to replicate the @channel from the anime Steins;Gate as much as possible (making this basically a parody of 4chan). Here you will find various channels dedicated to a variety of topics created by users. Users do not need to register an account before participating in a channel.

## Installation
Before cloning this repo, make sure you have `pip` and `python 2.7.x` installed. The 

**@channel as portrayed in the anime**
!["@channel as portrayed in anime"](static/img/@channel.gif "@channel as portrayed in the anime")

**@channel as portrayed in the VN**
!["@channel as portrayed in the VN"](static/img/VN/vn3.png "@channel as portrayed in the VN")

## Dependencies
**Installed via pip**
- Flask
- pymongo
- jQuery
- FitText
- TextFill (should get rid of either this or prev. one l8er)
- Mobile Detect
- Bootstrap
- Bootstrap Switch
- Bootstrap Markdown
- Bootstrap Image Gallery
- reCaptcha
- requests (python)

## Todo
<ul>
	<li>Find new way for resizing markdown content in each post. `Zoom` does not work in Firefox or IE, but does work on Chrome and Safari.</li>
	<li>Add stats to front page and channel pages. (http://flask.pocoo.org/snippets/71/ & http://stackoverflow.com/questions/12770950/flask-request-remote-addr-is-wrong-on-webfaction-and-not-showing-real-user-ip for getting number of users)</li>
	<li>Add reply and report buttons to each post.</li>
	<li>Add channel search.</li>
	<li>Add post search.</li>
	<li>Add channel descriptions.</li>
	<li>Add ability to choose user icon.</li>
</ul>