from pymongo import MongoClient
import os

host = os.environ['MONGODB_HOST']

clientDB = MongoClient(host, 27017)

