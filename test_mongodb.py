from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")

db = client["budget_buddy"]

print("MongoDB connected successfully!")
print("Database:", db.name)