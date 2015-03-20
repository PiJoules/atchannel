## Private Directory
The `private` directory which contains stuff you guys shouldn't know like usernames and passwords. Though I will give you the contents of them since they are required for running @channel.

### mongoClientConnection.py
```py
from pymongo import MongoClient

class MongoClientConnection:
	def __init__(self):
		self.connection = MongoClient("<MongoDB URI>")
```
