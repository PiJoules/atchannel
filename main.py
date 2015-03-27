"""`main` is the top level module for your Flask application."""

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

# http://flask.pocoo.org/snippets/71/


# Import the Flask Framework
from flask import Flask, render_template, request, jsonify, Response, redirect
app = Flask(__name__)

# Create mongoconnection
from private.mongoClientConnection import MongoClientConnection
client = MongoClientConnection().connection.atchannel

# Get captcha secret
from private.captchasecret import captcha
secret = captcha().secret

# hex regex
reg = re.compile("[a-f0-9]{24}")


# Testing parameter passing to url
@app.route('/', methods=['GET'])
def index():
	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]
	channelCount = client.channels.count()
	postCount = client.messages.count()

	postLimit = 20
	latestPosts = list( client.messages.find(sort=[("time", -1)], limit=5) )
	for i in range(len(latestPosts)):
		post = latestPosts[i]["message"]
		if len(post) > postLimit:
			latestPosts[i]["message"] = latestPosts[i]["message"][:postLimit] + "..."

	newestChannels = client.channels.find(limit=5, sort=[("time", -1)])
	popularChannels = client.channels.find(limit=5, sort=[("seq", -1)])

	return render_template("index.html",
		channels=channels,
		mainChannelCount=mainChannelCount,
		channelCount=channelCount,
		postCount=postCount,
		latestPosts=latestPosts,
		newestChannels=newestChannels,
		popularChannels=popularChannels
	)

@app.route('/<channel>', methods=['GET'])
def channel(channel="main"):
	limit = request.args.get("limit")
	style = request.args.get("style")

	if limit is None:
		limit = 50
	if style is None:
		style = "anime"

	if not channelDoesExist(channel):
		return "This channel does not exist", 404

	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	messages = getPosts(channel, 0, limit)

	return render_template("channel.html",
		messages = messages,
		style = style,
		channel=channel,
		channels=channels,
		mainChannelCount=mainChannelCount
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

	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	mainPost = getOnePost(ID)
	comments = getComments(ID, start, limit)

	return render_template("comments.html",
		mainPost=mainPost,
		messages=comments,
		channels=channels,
		mainChannelCount=mainChannelCount
	)

@app.route('/submitpost.html', methods=['GET'])
def submitchannel():
	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	return render_template("submitpost.html",
		channel=request.args.get("channel"),
		channels=channels,
		mainChannelCount=mainChannelCount
	)

@app.route('/submitchannel.html', methods=['GET'])
def submitpost():
	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	return render_template("submitchannel.html",
		channel=request.args.get("channel"),
		channels=channels,
		mainChannelCount=mainChannelCount
	)

# Need to get rid of this l8er
@app.route('/channels.html', methods=['GET'])
def channelsRedirect():
	return redirect("/channels")


@app.route('/channels/', methods=['GET'])
@app.route('/channels/<sort>/', methods=['GET'])
@app.route('/channels/<sort>/<int:page>', methods=['GET'])
def channels(sort="popular",page=0):
	limit = 20
	start = page*limit
	print start

	if sort == "latest":
		channels = client.channels.find(sort=[("time", -1)], skip=start, limit=limit)
	else:
		channels = client.channels.find(sort=[("seq", -1)], skip=start, limit=limit)

	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	return render_template("channels.html",
		channels=list(channels) or [],
		mainChannelCount=mainChannelCount,
		page=page,
		limit=limit,
		sort=sort
	)


@app.route('/about.html', methods=['GET'])
def about():
	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	return render_template("about.html",
		channels=channels,
		mainChannelCount=mainChannelCount
	)


@app.route('/rules.html', methods=['GET'])
def rules():
	channels = client.channels.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.channels.find_one({"_id": "main"})["seq"]

	return render_template("rules.html",
		channels=channels,
		mainChannelCount=mainChannelCount
	)


# Add a message to the database
@app.route('/addPost', methods=['POST'])
def addPost():
	if "name" in request.form and "message" in request.form and "time" in request.form and "channel" in request.form and "tags" in request.form:

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

		name = request.form["name"].strip()		
		message = request.form["message"].strip()
		time = request.form["time"].strip()
		channel = request.form["channel"].strip()
		tags = json.loads(request.form["tags"])

		if name == "":
			return "Invalid username"
		if message == "":
			return "Invalid message"
		if not time.isdigit():
			return "Invalid time"
		if channel == "":
			return "Invalid channel name"

		# Check if the tags exist
		tagsToInsert = []
		for tag in tags:
			if reg.match(tag):
				objId = ObjectId(tag)
				if client.messages.find({"_id": objId}).count() <= 0:
					return "Post with ID " + tag + " does not exist"
				else:
					tagsToInsert.append(objId)
			else:
				return tag + " is not a valid ID. All IDs are hexadecimal."

		# Get post number for the current post
		countUpdate = client.channels.find_and_modify({"_id": channel}, {"$inc": {"seq": 1}}, new=True)
		if countUpdate is None:
			return "This channel does not exist"

		# add post
		ID = client.messages.insert({
			"name": name,
			"message": message,
			"time": int(time),
			"channel": channel,
			"postNumber": int(countUpdate["seq"])
		})

		# add references to to other posts
		tagsToInsert = list(set(tagsToInsert)) # remove duplicates
		commentsToInsert = [{"basePost": ID, "refPost": refID} for refID in tagsToInsert]
		print commentsToInsert
		if len(commentsToInsert) > 0:
			client.comments.insert(commentsToInsert)

		# empty string means success :)
		return ""
	else:
		return "Unsucessful insertion: the username, message, time posted, associated tags, and channel name are required as parameters."


# Add a Channel to the database
@app.route('/addChannel', methods=['POST'])
def addChannel():
	if "channel" in request.form and "time" in request.form:
		channel = request.form["channel"].strip()
		time = int(request.form["time"].strip())

		if not channel.isalnum():
			return "The channel name must contain only aphanumeric characters"

		if channelDoesExist(channel):
			return "This channel already exists"

		client.channels.insert({
			"_id": channel,
			"seq": 0,
			"time": time
		})

		return ""
	else:
		return "Unsucessful creation: the channel name or current date is not provided"


@app.route('/getPosts', methods=['GET'])
def getPosts():
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
	if not channelDoesExist(channel):
		return "Channel does not exist"

	start = int(start)
	length = int(length)

	messages = getPosts(channel, start, length)
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



# Get posts from the database
# 
# The starting index starts from the beginning of the collection sorted by postNumber in reverse (the latest posts).
# If the collection has 100 rows and we receive a starting index of 10 and length 25, messages with postNumbers
# from 76 to 90. A staring index of 0 and length 90 will get postNumbers 11 to 100
def getPosts(channel, start, length):
	cursor = client.messages.find({"channel": channel}, skip=int(start), limit=int(length), sort=[("postNumber", -1)])
	messages = list(cursor)[::-1]
	return messages

def getOnePost(ID):
	return client.messages.find_one({"_id": ObjectId(ID)})

# Get all the comments for a post
def getComments(ID, start, length):
	references = client.comments.find({"refPost": ObjectId(ID)})
	basePostIDs = [reference["basePost"] for reference in references]
	basePosts = client.messages.find({ "_id": { "$in": basePostIDs } }, skip=int(start), limit=int(length), sort=[("time", -1)])
	comments = list(basePosts)[::-1]
	return comments

def getPostsHTML(posts):
	return render_template("posts.html", messages=posts)

def channelDoesExist(channel):
	return channel in client.channels.distinct("_id")


if __name__ == '__main__':
    app.run(port=8080, debug=True, host="0.0.0.0")

