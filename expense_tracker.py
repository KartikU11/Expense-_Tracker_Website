from expense import Expense
import csv
import os


def get_user_expense():

    expense_name = input("Enter expense name: ")

    while True:
        try:
            expense_amount = float(input("Enter expense amount: "))

            if expense_amount <= 0:
                print("Amount must be greater than 0.")
                continue

            break

        except ValueError:
            print("Enter a valid amount.")

    categories = [
        "Food",
        "Home",
        "Work",
        "Fun",
        "Misc"
    ]

    while True:

        print("\nSelect a category:")

        for i, category in enumerate(categories):
            print(f"{i + 1}. {category}")

        try:
            selected_index = int(input("Enter category number: ")) - 1

            if 0 <= selected_index < len(categories):
                category = categories[selected_index]
                return Expense(
                    expense_name,
                    category,
                    expense_amount
                )

            print("Invalid category.")

        except ValueError:
            print("Enter a valid number.")


def save_expense_to_file(expense, file_path):

    file_exists = os.path.exists(file_path)

    with open(file_path, "a", newline="", encoding="utf-8") as file:

        writer = csv.writer(file)

        if not file_exists:
            writer.writerow(["name", "amount", "category"])

        writer.writerow([
            expense.name,
            expense.amount,
            expense.category
        ])


def main():

    print("🎯 Running Expense Tracker!")

    expense_file_path = "expenses.csv"

    expense = get_user_expense()

    save_expense_to_file(
        expense,
        expense_file_path
    )

    print("Expense saved successfully!")


if __name__ == "__main__":
    main()