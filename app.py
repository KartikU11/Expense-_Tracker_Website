from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import csv
import os
from datetime import datetime

from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

app.secret_key = "budget-buddy-secret-key"

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")

db = client["BudgetBuddy"]

users_collection = db["users"]
expenses_collection = db["expenses"]

CSV_FILE = "expenses.csv"


@app.route("/")
def home():

    return render_template(
        "index.html",
        logged_in="user_id" in session,
        user_name=session.get("user_name")
    )


# Signup page
@app.route("/signup", methods=["GET", "POST"])
def signup():

    if request.method == "POST":

        name = request.form.get("displayName")
        email = request.form.get("email")
        password = request.form.get("password")

        # Check empty fields
        if not name or not email or not password:
            return render_template(
                "signup.html",
                error="All fields are required."
            )

        # Check password length
        if len(password) < 6:
            return render_template(
                "signup.html",
                error="Password must be at least 6 characters."
            )

        # Check if email already exists
        existing_user = users_collection.find_one({
            "email": email
        })

        if existing_user:
            return render_template(
                "signup.html",
                error="An account with this email already exists."
            )

        # Hash password
        hashed_password = generate_password_hash(password)

        # Create user
        user = {
            "name": name,
            "email": email,
            "password": hashed_password
        }

        # Save user to MongoDB
        result = users_collection.insert_one(user)

        # Create login session
        session["user_id"] = str(result.inserted_id)
        session["user_name"] = name

        # Redirect to main website
        return redirect(url_for("home"))

    return render_template("signup.html")



@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form.get("email")
        password = request.form.get("password")

        # Check empty fields
        if not email or not password:
            return render_template(
                "login.html",
                error="Email and password are required."
            )

        # Find user in MongoDB
        user = users_collection.find_one({
            "email": email
        })

        # Check user and password
        if not user or not check_password_hash(
            user["password"],
            password
        ):
            return render_template(
                "login.html",
                error="Invalid email or password."
            )

        # Create login session
        session["user_id"] = str(user["_id"])
        session["user_name"] = user["name"]

        # Redirect to main website
        return redirect(url_for("home"))

    return render_template("login.html")



@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("home"))


@app.route("/add_expense", methods=["POST"])
def add_expense():

    # Make sure user is logged in
    if "user_id" not in session:
        return jsonify({"message": "Please login first"}), 401

    data = request.get_json(silent=True)

    if not data:
        return jsonify({"message": "Invalid data"}), 400

    amount = data.get("amount")
    category = data.get("category")

    if amount is None or category is None:
        return jsonify({
            "message": "Amount and category are required"
        }), 400

    try:
        amount = float(amount)
    except (ValueError, TypeError):
        return jsonify({
            "message": "Invalid amount"
        }), 400

    if amount <= 0:
        return jsonify({
            "message": "Amount must be greater than 0"
        }), 400

    date = datetime.now().strftime("%Y-%m-%d")

    expense = {
        "user_id": session["user_id"],
        "name": "Expense",
        "amount": amount,
        "category": category,
        "date": date
    }

    expenses_collection.insert_one(expense)

    return jsonify({
        "message": "Expense saved successfully!"
    })


@app.route("/get_expenses", methods=["GET"])
def get_expenses():

    # Make sure user is logged in
    if "user_id" not in session:
        return jsonify({"message": "Please login first"}), 401

    expenses = []

    cursor = expenses_collection.find(
        {"user_id": session["user_id"]}
    ).sort("_id", -1)

    for expense in cursor:
        expenses.append({
            "id": str(expense["_id"]),
            "name": expense.get("name", "Expense"),
            "amount": expense.get("amount", 0),
            "category": expense.get("category", ""),
            "date": expense.get("date", "")
        })

    return jsonify(expenses)

# ------------------------
# Get User Budget
# ------------------------

@app.route("/get_budget", methods=["GET"])
def get_budget():

    # Make sure user is logged in
    if "user_id" not in session:
        return jsonify({"message": "Please login first"}), 401

    user = users_collection.find_one({
        "_id": ObjectId(session["user_id"])
    })

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    budget = user.get("budget", 20000)

    return jsonify({
        "budget": budget
    })


# ------------------------
# Update User Budget
# ------------------------

@app.route("/update_budget", methods=["POST"])
def update_budget():

    # Make sure user is logged in
    if "user_id" not in session:
        return jsonify({"message": "Please login first"}), 401

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "message": "Invalid data"
        }), 400

    budget = data.get("budget")

    try:
        budget = float(budget)
    except (ValueError, TypeError):
        return jsonify({
            "message": "Invalid budget"
        }), 400

    if budget <= 0:
        return jsonify({
            "message": "Budget must be greater than 0"
        }), 400

    result = users_collection.update_one(
        {
            "_id": ObjectId(session["user_id"])
        },
        {
            "$set": {
                "budget": budget
            }
        }
    )

    if result.matched_count == 0:
        return jsonify({
            "message": "User not found"
        }), 404

    return jsonify({
        "message": "Budget updated successfully!",
        "budget": budget
    })

@app.route("/delete_expense/<expense_id>", methods=["DELETE"])
def delete_expense(expense_id):

    # Make sure user is logged in
    if "user_id" not in session:
        return jsonify({"message": "Please login first"}), 401

    from bson.objectid import ObjectId

    try:
        result = expenses_collection.delete_one({
            "_id": ObjectId(expense_id),
            "user_id": session["user_id"]
        })

    except Exception:
        return jsonify({
            "message": "Invalid expense ID"
        }), 400

    if result.deleted_count == 0:
        return jsonify({
            "message": "Expense not found"
        }), 404

    return jsonify({
        "message": "Expense deleted successfully!"
    })


if __name__ == "__main__":
    app.run(debug=True)