"""
This is the main script that runs the application
and handles URLS and paging.
"""

# Call vendor to add the dependencies to the classpath
import vendor
vendor.add('lib')

import random
import requests
import re
import json
from datetime import datetime
import pymongo
from bson.objectid import ObjectId
from utils import *

# Import the Flask Framework
from flask import Flask, render_template, request, jsonify, Response, redirect
app = Flask(__name__)

# Create mongoconnection
from private.mongoClientConnection import MongoClientConnection
client = MongoClientConnection().connection.atchannel

# Get captcha secret
from private.captchasecret import captcha
secret = captcha().secret

# Hex regex
reg = re.compile("[a-f0-9]{24}")

# Limits
charLimit = 20
channelLimit = 20


# Testing parameter passing to url
@app.route('/', methods=['GET'])
def index():
	channelCount = client.channels.count()
	postCount = client.messages.count()

	latestPosts = list( client.messages.find(sort=[("time", -1)], limit=5) )
	for i in range(len(latestPosts)):
		post = latestPosts[i]["message"]
		if len(post) > charLimit:
			latestPosts[i]["message"] = latestPosts[i]["message"][:charLimit] + "..."

	newestChannels = list( client.channels.find(limit=5, sort=[("time", -1)]) )
	popularChannels = list( client.channels.find(limit=5, sort=[("seq", -1)]) )

	return render_template("index.html",
		channelCount=channelCount,
		postCount=postCount,
		latestPosts=latestPosts,
		newestChannels=newestChannels,
		popularChannels=popularChannels
	)

@app.route('/<channel>', methods=['GET'])
def channel(channel="main"):
	limit = 50

	if not channelDoesExist(client, channel):
		return "This channel does not exist", 404

	description = client.channels.find_one({"_id": channel})["description"]

	messages = get_posts(client, channel, 0, limit)

	return render_template("channel.html",
		messages = messages,
		channel=channel,
		description=description,
		limit=limit
	)

@app.route('/comments/<ID>', methods=['GET'])
def comments(ID=None):
	if ID is None:
		return "This post does no exist", 404

	limit = request.args.get("limit")
	start = request.args.get("start")

	if limit is None:
		limit = 50
	if start is None:
		start = 0

	if client.messages.find({"_id": ObjectId(ID)}).count() <= 0:
		return "The post with ID " + ID + " does not exist", 404

	mainPost = getOnePost(ID)
	comments = getComments(ID, start, limit)

	return render_template("comments.html",
		mainPost=mainPost,
		messages=comments,
		inComments=True
	)

@app.route('/submitchannel.html', methods=['GET'])
def submitchannel():
	return render_template("submitchannel.html")

# Need to get rid of this l8er
@app.route('/channels.html', methods=['GET'])
def channelsRedirect():
	return redirect("/channels")


@app.route('/channels/', methods=['GET'])
@app.route('/channels/<sort>/', methods=['GET'])
@app.route('/channels/<sort>/<int:page>', methods=['GET'])
def channels(sort="popular",page=0):
	start = page*channelLimit

	if sort == "latest":
		channels = client.channels.find(sort=[("time", -1)], skip=start, limit=channelLimit)
	else:
		channels = client.channels.find(sort=[("seq", -1)], skip=start, limit=channelLimit)

	return render_template("channels.html",
		channels=list(channels) or [],
		page=page,
		limit=channelLimit,
		sort=sort
	)


@app.route('/about.html', methods=['GET'])
def about():
	return render_template("about.html")


@app.route('/rules.html', methods=['GET'])
def rules():
	return render_template("rules.html")


"""
Add a message to the database
"""
@app.route('/addPost', methods=['POST'])
def add_post():
	if "name" in request.form and "message" in request.form and "time" in request.form and "channel" in request.form:
		name = request.form["name"].strip()		
		message = request.form["message"].strip()
		time = request.form["time"].strip()
		channel = request.form["channel"].strip()

		# Check validity
		if name == "":
			return "Invalid username"
		if message == "":
			return "Invalid message"
		if not time.isdigit():
			return "Invalid time"
		if channel == "":
			return "Invalid channel name"

		# Increment the number of posts in the channel.
		# The post number for the current post is the new number of posts.
		count_update = client.channels.find_and_modify({"_id": channel}, {"$inc": {"seq": 1}}, new=True)
		if count_update is None:
			return "This channel does not exist"

		# Actually add the post
		ID = client.messages.insert({
			"name": name,
			"message": message,
			"time": int(time),
			"channel": channel,
			"postNumber": int(count_update["seq"])
		})

		# Return empty string upon seccession
		return ""
	else:
		return "Unsucessful insertion: Did not receive either the username, channel, message, or time of post."


# Add a Channel to the database
@app.route('/addChannel', methods=['POST'])
def add_channel():
	if "channel" in request.form and "time" in request.form and "description" in request.form:
		# Do google captcha magic first
		if not "g-recaptcha-response" in request.form or request.form["g-recaptcha-response"] == "":
			return "Please prove you are a human."
		data = {
			"response": request.form["g-recaptcha-response"],
			"secret": secret,
			"remoteip": request.remote_addr
		}
		response = requests.post("https://www.google.com/recaptcha/api/siteverify", data)
		if not response.json()["success"]:
			return "Sorry, Google does not think you are a human."

		channel = request.form["channel"].strip()
		time = int(request.form["time"].strip())
		description = request.form["description"].strip()

		if not channel.isalnum():
			return "The channel name must contain only aphanumeric characters"
		if description == "":
			return "Please enter a channel description"
		if channelDoesExist(client, channel):
			return "This channel already exists"

		client.channels.insert({
			"_id": channel,
			"seq": 0,
			"time": time,
			"description": description
		})

		return ""
	else:
		return "Unsucessful creation: the channel name or current date is not provided"


"""
Route for handling get requests.
"""
@app.route('/getPosts', methods=['GET'])
def get_posts_handler():
	channel = request.args.get("channel")
	start = request.args.get("start")
	length = request.args.get("length")


	if start is None or not start.isdigit():
		return "Invalid starting index"
	if length is None or not length.isdigit():
		return "Invalid length"
	if channel is None or channel.strip() == "":
		return "Invalid channel name"

	channel = channel.strip()
	if not channelDoesExist(client, channel):
		return "Channel does not exist"

	start = int(start)
	length = int(length)

	messages = get_posts(client, channel, start, length)
	return jsonify(
		html=getPostsHTML(messages),
		messagesCount=len(messages),
		largestPostNumber=messages[-1]["postNumber"],
		smallestPostNumber=messages[0]["postNumber"]
	)



@app.errorhandler(404)
def page_not_found(e):
    """Return a custom 404 error."""
    return 'Sorry, Nothing at this URL.', 404


@app.errorhandler(500)
def page_not_found(e):
    """Return a custom 500 error."""
    return 'Sorry, unexpected error: {}'.format(e), 500



@app.context_processor
def utility_processor():
	def randFaceNum():
		return random.randrange(1,4);

	def randID():
		return '%09x' % random.randrange(16**9)

	def prettifyTime(time):
		"""
		yyyy/mm/dd (Day)  hh:mm:ss
		hh is from 00-23
		"""
		return datetime.fromtimestamp(time/1000.0).strftime("%Y/%m/%d (%a)  %H:%M:%S")

	def randColor():
		return random.choice([
			"#bbffff", # light blue
		    "#b694da", # some purple
		    "#bde0b1", # light green
		    "#a0e1b4", # darker green
		    "#a63333", # reddish
		    "#d090c4", # pinkish
		    "#fffed9", # yellowish,
		    "#ffd39b", # lighty orange
		    "#74bbfb" # darker blue
		])

	return dict(randID=randID, prettifyTime=prettifyTime, randFaceNum=randFaceNum, randColor=randColor)


if __name__ == '__main__':
    app.run()

