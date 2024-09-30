"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const $overlay = document.querySelector("#overlay");
// const $modal = document.querySelector("#modal") as HTMLDivElement;
const $incomeBtn = document.querySelector("#incomeBtn");
const $expenseBtn = document.querySelector("#expenseBtn");
const $closeBtn = document.querySelector("#closeBtn");
const $transactionForm = document.querySelector("#transactionForm");
// const $alertError = document.querySelector("#alertError") as HTMLDivElement;
const $transactionList = document.querySelector("#transactionList");
const $displayIncome = document.querySelector("#displayIncome");
const $displayExpense = document.querySelector("#displayExpense");
String.prototype.separateCurrency = function () {
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const url = new URL(location.href);
let INCOMES = JSON.parse(localStorage.getItem("incomes")) || [];
let EXPENSES = JSON.parse(localStorage.getItem("expenses")) || [];
const renderTransactions = () => {
    $transactionList.innerHTML = '';
    EXPENSES.forEach((transaction) => {
        const li = document.createElement('li');
        li.className = "list-group-item flex items-center justify-between mb-4";
        li.innerHTML = `
        <div class="flex items-center justify-between p-6 align-middle shadow-md w-full rounded-lg h-auto bg-white">
            <div class="flex flex-col">
                <div class="text-xl text-gray-700 font-bold">${transaction.transactionType || 'Тип не указан'}</div>
                <div class="text-lg text-gray-500 ml-2">${transaction.transactionName}</div>
            </div>
            <div class="text-right">
                <div class="font-bold text-lg text-green-600">${transaction.transactionAmount} UZS</div>
                <div class="text-sm text-gray-400">${new Date(transaction.date).toLocaleTimeString()}</div>
                <div class="flex space-x-4 mt-2">
                    <button class="text-blue-500 hover:text-blue-700 font-semibold border border-blue-500 px-2 py-1 rounded">Edit</button>
                    <button class="text-red-500 hover:text-red-700 font-semibold border border-red-500 px-2 py-1 rounded  " onclick="deleteTransaction(${transaction.date})">Delete</button>
                </div>
            </div>
        </div>
        `;
        li.addEventListener("click", (event) => {
            if (event.target.classList.contains("text-blue-500 hover:text-blue-700")) {
                $transactionList.appendChild(li);
            }
        });
        $transactionList.appendChild(li);
    });
};
const deleteTransaction = (timestamp) => {
    if (getCurrentQuery() === "income") {
        INCOMES = INCOMES.filter((income) => income.date !== timestamp);
        localStorage.setItem("incomes", JSON.stringify(INCOMES));
    }
    else {
        EXPENSES = EXPENSES.filter((expense) => expense.date !== timestamp);
        localStorage.setItem("expenses", JSON.stringify(EXPENSES));
    }
    renderTransactions();
    checkBalance();
};
const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};
const checkModalOpen = () => {
    let openModal = getCurrentQuery();
    let $select = $transactionForm.querySelector("select");
    if (openModal === "income") {
        $overlay.classList.remove("hidden");
        $select.classList.add("hidden");
    }
    else if (openModal === "expense") {
        $overlay.classList.remove("hidden");
        $select.classList.remove("hidden");
    }
    else {
        $overlay.classList.add("hidden");
    }
};
class Transaction {
    transactionName;
    transactionType;
    transactionAmount;
    type;
    date;
    constructor(transactionName, transactionAmount, transactionType, type) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}
let totalIncome = 0;
let totalExpense = 0;
const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc, nextIncome) => acc + nextIncome.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc, nextIncome) => acc + nextIncome.transactionAmount, 0);
    $displayExpense.innerHTML = `${totalExpense.toString().separateCurrency()} UZS`;
    $displayIncome.innerHTML = `${(totalIncome - totalExpense).toString().separateCurrency()} UZS`;
};
checkBalance();
const rendeChart = () => {
    document.querySelector("#chartWrapper").innerHTML = `<canvas id="transactionChart"></canvas>`;
    const $transactionChart = document.querySelector("#transactionChart");
    let deleyed = false;
    // @ts-ignore
    new Chart($transactionChart, {
        type: 'pie',
        data: {
            datasets: [{
                    label: 'Data for Income and Expense',
                    data: [totalIncome, totalExpense],
                    borderWidth: 3,
                    backgroundColor: ["green", "red"],
                }],
            labels: ['Income', 'Expense'],
        },
        options: {
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        boxWidth: 20,
                        padding: 15
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                onComplete: () => {
                    deleyed = true;
                },
                // @ts-ignore
                delay: (context) => {
                    let delay = 0;
                    if (context.type === 'data' && context.mode === 'default' && !deleyed) {
                        delay = context.dataIndex * 300 + context.datasetIndex * 100;
                    }
                    return delay;
                },
            },
        },
    });
};
rendeChart();
const createNewTransaction = (e) => {
    e.preventDefault();
    const inputs = Array.from($transactionForm.querySelectorAll("input, select"));
    const values = inputs.map((input) => {
        if (input.type === "number") {
            return +input.value;
        }
        return input.value ? input.value : undefined;
    });
    if (values.slice(0, getCurrentQuery() === "income" ? -1 : undefined).every((value) => (typeof value === "string" ? value?.trim().length > 0 : value && value > 0))) {
        const newTransaction = new Transaction(...values, getCurrentQuery());
        if (getCurrentQuery() === "income") {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        }
        else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSES));
        }
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen();
        inputs.forEach((input) => input.value = "");
        renderTransactions();
        checkBalance();
        rendeChart();
    }
    else {
        alert("Please fill in all fields");
    }
};
$incomeBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "income");
    window.history.pushState({ path: location.href.split("?")[0] + "?" + url.searchParams }, "", location.href.split("?")[0] + "?" + url.searchParams);
    checkModalOpen();
});
$expenseBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "expense");
    window.history.pushState({ path: location.href.split("?")[0] + "?" + url.searchParams }, "", location.href.split("?")[0] + "?" + url.searchParams);
    checkModalOpen();
});
$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});
$transactionForm.addEventListener("submit", createNewTransaction);
window.onload = () => {
    checkModalOpen();
    renderTransactions();
};
