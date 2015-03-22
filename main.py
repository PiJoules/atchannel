"""`main` is the top level module for your Flask application."""

# Call vendor to add the dependencies to the classpath
import vendor
vendor.add('lib')

import random
from datetime import datetime
import pymongo

# Import the Flask Framework
from flask import Flask, render_template, request, jsonify, Response
app = Flask(__name__)

# Create mongoconnection
from private.mongoClientConnection import MongoClientConnection
client = MongoClientConnection().connection.atchannel


# Testing parameter passing to url
@app.route('/', methods=['GET'])
@app.route('/<channel>', methods=['GET'])
def index(channel="main"):
	limit = request.args.get("limit")
	style = request.args.get("style")

	if limit is None:
		limit = 50
	if style is None:
		style = "anime"

	if not channelDoesExist(channel):
		return "This channel does not exist", 404

	channels = client.counter.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.counter.find_one({"_id": "main"})["seq"]

	messages = getPosts(channel, 0, limit)

	return render_template("channel.html",
		messages = messages,
		style = style,
		channel=channel,
		channels=channels,
		mainChannelCount=mainChannelCount
	)

@app.route('/submitpost.html', methods=['GET'])
def submitpost():
	channels = client.counter.find({"_id": {"$ne": "main"}}).sort("seq", pymongo.DESCENDING)
	mainChannelCount = client.counter.find_one({"_id": "main"})["seq"]

	return render_template("submitpost.html",
		channels=channels,
		mainChannelCount=mainChannelCount
	)


# Add a message to the database
@app.route('/addPost', methods=['POST'])
def addPost():
	if "name" in request.form and "message" in request.form and "time" in request.form and "channel" in request.form:
		name = request.form["name"].strip()		
		message = request.form["message"].strip()
		time = request.form["time"].strip()
		channel = request.form["channel"].strip()

		if name == "":
			return "Invalid username"
		if message == "":
			return "Invalid message"
		if not time.isdigit():
			return "Invalid time"
		if channel == "":
			return "Invalid channel name"

		countUpdate = client.counter.find_and_modify({"_id": channel}, {"$inc": {"seq": 1}}, new=True)
		if countUpdate is None:
			return "Channel does not exist"

		client.messages.insert({
			"name": name,
			"message": message,
			"time": int(time),
			"channel": channel,
			"postNumber": int(countUpdate["seq"])
		})

		# empty string means success :)
		return ""
	else:
		return "Unsucessful insertion: the username, message, time posted, and channel name are required as parameters."


# Add a Channel to the database
@app.route('/addChannel', methods=['POST'])
def addChannel():
	if "channel" in request.form:
		channel = request.form["channel"].strip()
		if not channel.isalnum():
			return "The channel name must contain only aphanumeric characters"

		if channelDoesExist(channel):
			return "This channel already exists"

		client.counter.insert({
			"_id": channel,
			"seq": 0
		})

		return ""
	else:
		return "Unsucessful creation: the channel name is not provided"


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
	return jsonify(messages=messages, html=getPostsHTML(messages))



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
	cursor = client.messages.find({"channel": channel}, skip=start, limit=length, sort=[("postNumber", -1)], fields={"_id": False})
	messages = list( cursor )[::-1]
	return messages

def getPostsHTML(posts):
	return render_template("posts.html", messages=posts)

def channelDoesExist(channel):
	return channel in client.counter.distinct("_id")


if __name__ == '__main__':
    app.run(port=8080, debug=True, host="0.0.0.0")

