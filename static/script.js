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
// Open Budget Modal
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

        document.getElementById("budgetInput").value = currentBudget;

        document.getElementById("budgetModal").style.display = "flex";

        setTimeout(function () {

            document.getElementById("budgetInput").focus();

        }, 100);

    } catch (error) {

        console.error(error);

    }

}


// ------------------------
// Close Budget Modal
// ------------------------

function closeBudgetModal() {

    document.getElementById("budgetModal").style.display = "none";

}


// ------------------------
// Save Budget
// ------------------------

async function saveBudget() {

    const input =
        document.getElementById("budgetInput");

    const newBudget =
        input.value.trim();


    if (
        newBudget === "" ||
        isNaN(newBudget) ||
        Number(newBudget) <= 0
    ) {

        document.getElementById("budgetError").innerText =
            "Please enter a valid budget.";

        return;

    }


    try {

        const updateResponse = await fetch("/update_budget", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                budget: Number(newBudget)
            })

        });


        const updateData =
            await updateResponse.json();


        if (!updateResponse.ok) {

            document.getElementById("budgetError").innerText =
                updateData.message ||
                "Failed to update budget.";

            return;

        }


        updateBudgetDisplay(updateData.budget);

        closeBudgetModal();

        await loadExpenses();


    } catch (error) {

        console.error(error);

        document.getElementById("budgetError").innerText =
            "Unable to connect to the server.";

    }

}


// ------------------------
// Open Add Expense Modal
// ------------------------

function openModal() {

    document.getElementById("expenseModal").style.display = "flex";

}


// ------------------------
// Close Add Expense Modal
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

            alert(
                data.message ||
                "Failed to save expense."
            );

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

        const response =
            await fetch("/get_expenses");

        const expenses =
            await response.json();


        let transactionList =
            document.getElementById("transactionList");


        transactionList.innerHTML = "";


        let totalSpent = 0;


        if (!response.ok) {

            transactionList.innerHTML =
                "<p class='empty-state'>Unable to load transactions.</p>";

            return;

        }


        if (expenses.length === 0) {

            transactionList.innerHTML =
                "<p class='empty-state'>No transactions yet.</p>";

        }


        // Backend already returns newest first
        expenses.forEach(function (expense) {

            totalSpent += Number(expense.amount);


            transactionList.innerHTML += `

                <div class="item"
                     data-category="${expense.category}">

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
                            onclick="openDeleteModal('${expense.id}')">

                            ✕

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
            "<p class='empty-state'>Unable to load transactions.</p>";

    }

}


// ------------------------
// Delete Confirmation Modal
// ------------------------

let expenseToDelete = null;


function openDeleteModal(expenseId) {

    expenseToDelete = expenseId;

    document.getElementById("deleteModal").style.display = "flex";

}


// ------------------------
// Close Delete Modal
// ------------------------

function closeDeleteModal() {

    expenseToDelete = null;

    document.getElementById("deleteModal").style.display = "none";

}


// ------------------------
// Confirm Delete
// ------------------------

async function confirmDelete() {

    if (!expenseToDelete) {

        return;

    }


    try {

        const response = await fetch(
            `/delete_expense/${expenseToDelete}`,
            {
                method: "DELETE"
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            document.getElementById("deleteError").innerText =
                data.message ||
                "Failed to delete expense.";

            return;

        }


        closeDeleteModal();

        await loadExpenses();


    } catch (error) {

        console.error(error);

        document.getElementById("deleteError").innerText =
            "Unable to connect to the server.";

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


    let spentPercentage =
        Math.min(percentage, 100);


    let remainingPercentage =
        Math.max(0, 100 - percentage);


    // Total spent percentage

    document.getElementById("spentPercentage").innerHTML =
        percentage.toFixed(1) + "% of your budget";


    // Remaining percentage

    document.getElementById("remainingPercentage").innerHTML =
        remainingPercentage.toFixed(1) + "% of your budget";


    // Spent progress

    document.getElementById("spentProgress").style.width =
        spentPercentage + "%";


    // Remaining progress

    document.getElementById("remainingProgress").style.width =
        remainingPercentage + "%";


    // Budget health

    document.getElementById("budgetProgress").style.width =
        spentPercentage + "%";


    document.getElementById("budgetHealthText").innerHTML =
        "₹" + totalSpent.toLocaleString() +
        " spent of ₹" + budget.toLocaleString();


    document.getElementById("healthPercentage").innerHTML =
        percentage.toFixed(1) + "%";


    // Health message

    let healthMessage =
        document.getElementById("healthMessage");


    if (percentage >= 100) {

        healthMessage.innerHTML =
            "● You have exceeded your budget!";

        healthMessage.style.color =
            "#ff5c5c";

    } else if (percentage >= 80) {

        healthMessage.innerHTML =
            "● You are close to your budget limit.";

        healthMessage.style.color =
            "#ffb347";

    } else {

        healthMessage.innerHTML =
            "● You're well within your budget!";

        healthMessage.style.color =
            "#52df68";

    }

}


// ------------------------
// Category Split
// ------------------------

function updateCategorySplit(expenses) {

    let categoryTotals = {};

    let total = 0;


    expenses.forEach(function (expense) {

        let category =
            expense.category;

        let amount =
            Number(expense.amount);


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
            "<p class='empty-state'>No expenses yet.</p>";

        return;

    }


    Object.keys(categoryTotals).forEach(function (category) {

        let percentage =
            (categoryTotals[category] / total) * 100;


        categorySplit.innerHTML += `

            <div class="category-row">

                <div class="category-top">

                    <div class="category-name">

                        <span class="category-dot"></span>

                        ${category}

                    </div>

                    <span class="category-percent">
                        ${percentage.toFixed(1)}%
                    </span>

                </div>


                <div class="category-bar">

                    <span style="width:${percentage}%"></span>

                </div>


                <span class="category-amount">
                    ₹${categoryTotals[category].toLocaleString()}
                </span>

            </div>

        `;

    });


    categorySplit.innerHTML += `

        <div class="category-total">

            <span>Total</span>

            <span>
                ₹${total.toLocaleString()}
            </span>

        </div>

    `;

}


// ------------------------
// Close Modal When Clicking Outside
// ------------------------

window.addEventListener("click", function (event) {

    const expenseModal =
        document.getElementById("expenseModal");

    const budgetModal =
        document.getElementById("budgetModal");

    const deleteModal =
        document.getElementById("deleteModal");


    if (event.target === expenseModal) {

        closeModal();

    }


    if (event.target === budgetModal) {

        closeBudgetModal();

    }


    if (event.target === deleteModal) {

        closeDeleteModal();

    }

});


// ------------------------
// ESC Key
// ------------------------

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal();
        closeBudgetModal();
        closeDeleteModal();

    }

});