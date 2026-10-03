// ------------------------
// Load Page
// ------------------------

window.onload = function () {

    loadBudget();

    loadExpenses();

};

// ------------------------
// Load Budget
// ------------------------

async function loadBudget() {

    try {

        const response = await fetch("/get_budget");

        const data = await response.json();

        if (!response.ok) {

            console.error(data.message);

            return;

        }

        updateBudgetDisplay(data.budget);

    } catch (error) {

        console.error(error);

    }

}


// ------------------------
// Update Budget Display
// ------------------------

function updateBudgetDisplay(budget) {

    budget = Number(budget) || 20000;

    document.getElementById("budgetDisplay").innerHTML =
        "₹" + budget.toLocaleString();

}


// ------------------------
// Edit Budget
// ------------------------

async function editBudget() {

    try {

        const response = await fetch("/get_budget");

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Unable to get budget.");

            return;

        }

        let currentBudget = Number(data.budget) || 20000;

        let newBudget = prompt(
            "Enter your monthly budget:",
            currentBudget
        );

        if (
            newBudget === null
        ) {
            return;
        }

        if (
            newBudget.trim() === "" ||
            isNaN(newBudget) ||
            Number(newBudget) <= 0
        ) {

            alert("Please enter a valid budget.");

            return;

        }

        const updateResponse = await fetch("/update_budget", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                budget: Number(newBudget)
            })

        });

        const updateData = await updateResponse.json();

        if (!updateResponse.ok) {

            alert(
                updateData.message ||
                "Failed to update budget."
            );

            return;

        }

        updateBudgetDisplay(updateData.budget);

        loadExpenses();

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

}


// ------------------------
// Open Modal
// ------------------------

function openModal() {

    document.getElementById("expenseModal").style.display = "flex";

}


// ------------------------
// Close Modal
// ------------------------

function closeModal() {

    document.getElementById("expenseModal").style.display = "none";

}


// ------------------------
// Save Expense
// ------------------------

async function saveExpense() {

    let amount =
        Number(document.getElementById("amount").value);

    let category =
        document.getElementById("category").value;


    if (amount <= 0 || isNaN(amount)) {

        alert("Enter a valid amount.");

        return;

    }


    try {

        const response = await fetch("/add_expense", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                amount: amount,
                category: category
            })

        });


        const data = await response.json();


        if (!response.ok) {

            alert(data.message || "Failed to save expense.");

            return;

        }


        document.getElementById("amount").value = "";

        closeModal();

        await loadExpenses();


    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

}


// ------------------------
// Load Expenses
// ------------------------

async function loadExpenses() {

    try {

        const response = await fetch("/get_expenses");

        const expenses = await response.json();


        let transactionList =
            document.getElementById("transactionList");


        transactionList.innerHTML = "";


        let totalSpent = 0;


        if (expenses.length === 0) {

            transactionList.innerHTML =
                "<p>No transactions yet.</p>";

        }


        expenses.slice().reverse().forEach(function (expense) {

            totalSpent += Number(expense.amount);


            transactionList.innerHTML += `

                <div class="item">

                    <div>

                        <strong>
                            ${expense.category}
                        </strong>

                        <br>

                        <small>
                            ${expense.date || "Date not available"}
                        </small>

                    </div>

                    <div>

                        -₹${Number(expense.amount).toLocaleString()}

                        <br>

                        <button
                            class="delete-btn"
                            onclick="deleteExpense('${expense.id}')">
                            Delete
                        </button>

                    </div>

                </div>

            `;

        });


        updateSummary(totalSpent);

        updateCategorySplit(expenses);


    } catch (error) {

        console.error(error);

        document.getElementById("transactionList").innerHTML =
            "<p>Unable to load transactions.</p>";

    }

}

async function deleteExpense(expenseId) {

    if (!confirm("Are you sure you want to delete this transaction?")) {
        return;
    }

    try {

        const response = await fetch(
            `/delete_expense/${expenseId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to delete expense.");
            return;
        }

        await loadExpenses();

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }
}

// ------------------------
// Update Summary
// ------------------------

function updateSummary(totalSpent) {

    let budget =
        Number(
            document
                .getElementById("budgetDisplay")
                .innerText
                .replace(/[₹,]/g, "")
        ) || 20000;


    let remaining =
        budget - totalSpent;


    document.getElementById("spentDisplay").innerHTML =
        "₹" + totalSpent.toLocaleString();


    document.getElementById("remainingDisplay").innerHTML =
        "₹" + remaining.toLocaleString();


    let percentage =
        budget > 0
            ? (totalSpent / budget) * 100
            : 0;


    percentage = Math.min(percentage, 100);


    document.getElementById("spentProgress").style.width =
        percentage + "%";


    document.getElementById("budgetProgress").style.width =
        percentage + "%";


    document.getElementById("budgetHealthText").innerHTML =
        "₹" + totalSpent.toLocaleString() +
        " / ₹" + budget.toLocaleString();

}


// ------------------------
// Category Split
// ------------------------

function updateCategorySplit(expenses) {

    let categoryTotals = {};

    let total = 0;


    expenses.forEach(function (expense) {

        let category = expense.category;

        let amount = Number(expense.amount);


        if (!categoryTotals[category]) {

            categoryTotals[category] = 0;

        }


        categoryTotals[category] += amount;

        total += amount;

    });


    let categorySplit =
        document.getElementById("categorySplit");


    categorySplit.innerHTML = "";


    if (total === 0) {

        categorySplit.innerHTML =
            "<p>No expenses yet.</p>";

        return;

    }


    Object.keys(categoryTotals).forEach(function (category) {

        let percentage =
            (categoryTotals[category] / total) * 100;


        categorySplit.innerHTML += `

            <p>
                ${category} ${percentage.toFixed(1)}%
            </p>

            <div class="bar">

                <span style="width:${percentage}%"></span>

            </div>

        `;

    });

}