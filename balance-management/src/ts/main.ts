import BalanceHandler from './balance';

const getBalance = document.getElementById("balance") as HTMLInputElement;
const balanceInputField = document.getElementById("balance-input-field") as HTMLFormElement;
const balanceList = document.getElementById("balance-list") as HTMLElement;
const notification = document.getElementById("notification") as HTMLElement;
const description = document.getElementById('description') as HTMLInputElement;

const oldest = document.getElementById("oldest") as HTMLInputElement;
const newest = document.getElementById("newest") as HTMLInputElement;

const incomeTotal = document.querySelector("#income-total") as HTMLElement;
const expenseTotal = document.querySelector("#expense-total") as HTMLElement;
const income_expense = document.querySelector("#income_expense") as HTMLElement;

const displayer = BalanceHandler({ 
    getBalance, balanceInputField, balanceList, notification, oldest, newest, incomeTotal, 
    expenseTotal, income_expense, description 
});

async function init(): Promise<void> {
    await displayer.initEventListeners();
}

function teardown(): void {
    displayer.cleanup();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);