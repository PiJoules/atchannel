"""
Utility functions that don't handle paging. Keep
all the helper functions here and the app handlers
in the main script.
"""

from flask import render_template

"""
Get posts from the database in reverse order.
"""
def get_posts(client, channel, start, length):
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

def channelDoesExist(client, channel):
	return channel in client.channels.distinct("_id")