// ========================
// LOAD PAGE
// ========================

window.onload = function () {

    setCurrentMonth();

    loadBudget();

    loadExpenses();

};


// ========================
// CURRENT MONTH
// ========================

function setCurrentMonth() {

    const monthElement =
        document.getElementById("currentMonth");

    if (!monthElement) {
        return;
    }

    const now = new Date();

    const month =
        now.toLocaleString("en-US", {
            month: "long"
        });

    const year =
        now.getFullYear();

    monthElement.innerText =
        month + " " + year;

}


// ========================
// LOAD BUDGET
// ========================

async function loadBudget() {

    try {

        const response =
            await fetch("/get_budget");

        const data =
            await response.json();

        if (!response.ok) {

            console.error(data.message);

            return;

        }

        updateBudgetDisplay(data.budget);

    }

    catch (error) {

        console.error(error);

    }

}


// ========================
// UPDATE BUDGET DISPLAY
// ========================

function updateBudgetDisplay(budget) {

    budget =
        Number(budget) || 20000;

    document.getElementById(
        "budgetDisplay"
    ).innerHTML =
        "₹" + budget.toLocaleString();

}


// ========================
// EDIT BUDGET
// ========================

async function editBudget() {

    try {

        const response =
            await fetch("/get_budget");

        const data =
            await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to get budget."
            );

            return;

        }

        let currentBudget =
            Number(data.budget) || 20000;


        let newBudget =
            prompt(
                "Enter your monthly budget:",
                currentBudget
            );


        if (newBudget === null) {

            return;

        }


        if (
            newBudget.trim() === "" ||
            isNaN(newBudget) ||
            Number(newBudget) <= 0
        ) {

            alert(
                "Please enter a valid budget."
            );

            return;

        }


        const updateResponse =
            await fetch(
                "/update_budget",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        budget:
                            Number(newBudget)

                    })

                }
            );


        const updateData =
            await updateResponse.json();


        if (!updateResponse.ok) {

            alert(
                updateData.message ||
                "Failed to update budget."
            );

            return;

        }


        updateBudgetDisplay(
            updateData.budget
        );


        loadExpenses();

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );

    }

}


// ========================
// OPEN MODAL
// ========================

function openModal() {

    document.getElementById(
        "expenseModal"
    ).style.display = "flex";

}


// ========================
// CLOSE MODAL
// ========================

function closeModal() {

    document.getElementById(
        "expenseModal"
    ).style.display = "none";

}


// ========================
// SAVE EXPENSE
// ========================

async function saveExpense() {

    let amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );


    let category =
        document.getElementById(
            "category"
        ).value;


    if (
        amount <= 0 ||
        isNaN(amount)
    ) {

        alert(
            "Enter a valid amount."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/add_expense",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        amount: amount,

                        category: category

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to save expense."
            );

            return;

        }


        document.getElementById(
            "amount"
        ).value = "";


        closeModal();


        await loadExpenses();

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );

    }

}


// ========================
// LOAD EXPENSES
// ========================

async function loadExpenses() {

    try {

        const response =
            await fetch(
                "/get_expenses"
            );


        const expenses =
            await response.json();


        const transactionList =
            document.getElementById(
                "transactionList"
            );


        transactionList.innerHTML = "";


        let totalSpent = 0;


        if (
            !Array.isArray(expenses)
        ) {

            throw new Error(
                "Invalid expense data."
            );

        }


        if (
            expenses.length === 0
        ) {

            transactionList.innerHTML = `

                <div class="empty-state">

                    No transactions yet.

                    <br>

                    Click "+ Add Entry" to add your first transaction.

                </div>

            `;

        }


        // MongoDB already returns newest first.
        // Therefore, do NOT reverse the array.

        expenses.forEach(
            function (expense) {

                totalSpent +=
                    Number(
                        expense.amount
                    );


                transactionList.innerHTML += `

                    <div class="item"
                         data-category="${expense.category}">

                        <div>

                            <strong>
                                ${expense.category}
                            </strong>

                            <small>
                                ${expense.date || "Date not available"}
                            </small>

                        </div>


                        <div>

                            <span>
                                -₹${Number(
                                    expense.amount
                                ).toLocaleString()}
                            </span>


                            <button
                                class="delete-btn"
                                onclick="deleteExpense('${expense.id}')"
                                title="Delete transaction">

                                ✕

                            </button>

                        </div>

                    </div>

                `;

            }
        );


        updateSummary(
            totalSpent
        );


        updateCategorySplit(
            expenses
        );

    }

    catch (error) {

        console.error(error);

        document.getElementById(
            "transactionList"
        ).innerHTML = `

            <div class="empty-state">

                Unable to load transactions.

            </div>

        `;

    }

}


// ========================
// DELETE EXPENSE
// ========================

async function deleteExpense(
    expenseId
) {

    if (
        !confirm(
            "Are you sure you want to delete this transaction?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/delete_expense/${expenseId}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to delete expense."
            );

            return;

        }


        await loadExpenses();

    }

    catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );

    }

}


// ========================
// UPDATE SUMMARY
// ========================

function updateSummary(
    totalSpent
) {

    let budget =
        Number(
            document
                .getElementById(
                    "budgetDisplay"
                )
                .innerText
                .replace(
                    /[₹,]/g,
                    ""
                )
        ) || 20000;


    let remaining =
        budget - totalSpent;


    document.getElementById(
        "spentDisplay"
    ).innerHTML =
        "₹" +
        totalSpent.toLocaleString();


    document.getElementById(
        "remainingDisplay"
    ).innerHTML =
        "₹" +
        remaining.toLocaleString();


    let percentage =
        budget > 0
            ? (totalSpent / budget) * 100
            : 0;


    let safePercentage =
        Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        );


    let remainingPercentage =
        Math.max(
            100 - percentage,
            0
        );


    // Spent progress

    const spentProgress =
        document.getElementById(
            "spentProgress"
        );

    if (spentProgress) {

        spentProgress.style.width =
            safePercentage + "%";

    }


    // Remaining progress

    const remainingProgress =
        document.getElementById(
            "remainingProgress"
        );

    if (remainingProgress) {

        remainingProgress.style.width =
            Math.min(
                remainingPercentage,
                100
            ) + "%";

    }


    // Spent percentage

    const spentPercentage =
        document.getElementById(
            "spentPercentage"
        );

    if (spentPercentage) {

        spentPercentage.innerText =
            percentage.toFixed(1) +
            "% of your budget";

    }


    // Remaining percentage

    const remainingPercentageElement =
        document.getElementById(
            "remainingPercentage"
        );

    if (
        remainingPercentageElement
    ) {

        remainingPercentageElement.innerText =
            remainingPercentage.toFixed(1) +
            "% of your budget";

    }


    // Budget health

    const healthText =
        document.getElementById(
            "budgetHealthText"
        );

    if (healthText) {

        healthText.innerText =
            "₹" +
            totalSpent.toLocaleString() +
            " spent of ₹" +
            budget.toLocaleString();

    }


    const healthPercentage =
        document.getElementById(
            "healthPercentage"
        );

    if (healthPercentage) {

        healthPercentage.innerText =
            percentage.toFixed(1) +
            "%";

    }


    const budgetProgress =
        document.getElementById(
            "budgetProgress"
        );

    if (budgetProgress) {

        budgetProgress.style.width =
            safePercentage + "%";

    }


    // Health message

    const healthMessage =
        document.getElementById(
            "healthMessage"
        );


    if (healthMessage) {

        if (percentage >= 100) {

            healthMessage.innerText =
                "● You have exceeded your budget.";

            healthMessage.style.color =
                "#ff5c5c";

        }

        else if (percentage >= 80) {

            healthMessage.innerText =
                "● You're getting close to your budget.";

            healthMessage.style.color =
                "#ffbd55";

        }

        else {

            healthMessage.innerText =
                "● You're well within your budget.";

            healthMessage.style.color =
                "#52df68";

        }

    }

}


// ========================
// CATEGORY SPLIT
// ========================

function updateCategorySplit(
    expenses
) {

    let categoryTotals = {};

    let total = 0;


    expenses.forEach(
        function (expense) {

            let category =
                expense.category;

            let amount =
                Number(
                    expense.amount
                );


            if (
                !categoryTotals[category]
            ) {

                categoryTotals[category] =
                    0;

            }


            categoryTotals[category] +=
                amount;


            total += amount;

        }
    );


    const categorySplit =
        document.getElementById(
            "categorySplit"
        );


    categorySplit.innerHTML = "";


    if (total === 0) {

        categorySplit.innerHTML = `

            <p class="empty-state">
                No expenses yet.
            </p>

        `;

        return;

    }


    Object.keys(
        categoryTotals
    ).forEach(
        function (category) {

            let percentage =
                (
                    categoryTotals[category]
                    / total
                ) * 100;


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

                        <span
                            style="width:${percentage}%">
                        </span>

                    </div>


                    <span class="category-amount">

                        ₹${categoryTotals[
                            category
                        ].toLocaleString()}

                    </span>

                    <div style="clear:both"></div>

                </div>

            `;

        }
    );


    categorySplit.innerHTML += `

        <div class="category-total">

            <span>
                Total
            </span>

            <span>
                ₹${total.toLocaleString()}
            </span>

        </div>

    `;

}