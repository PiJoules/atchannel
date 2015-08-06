"""
Utility functions that don't handle paging. Keep
all the helper functions here and the app handlers
in the main script.
"""

"""
Get posts from the database.

The starting index starts from the beginning of the collection sorted by postNumber in reverse (the latest posts).
If the collection has 100 rows and we receive a starting index of 10 and length 25, messages with postNumbers
from 76 to 90. A staring index of 0 and length 90 will get postNumbers 11 to 100
"""
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