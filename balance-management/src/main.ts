import Displayer from './balance';

const getBalance = document.getElementById("balance") as HTMLInputElement;
const balanceInputField = document.getElementById("balance-input-field") as HTMLFormElement;
const balanceList = document.getElementById("balance-list") as HTMLElement;
const notification = document.getElementById("notification") as HTMLElement;
const addBalance = document.getElementById("add-balance") as HTMLButtonElement;
const oldest = document.getElementById("oldest") as HTMLInputElement;
const newest = document.getElementById("newest") as HTMLInputElement;

const incomeTotal = document.querySelector(".income-total") as HTMLElement;
const expenseTotal = document.querySelector(".expense-total") as HTMLElement;
const income_expense = document.querySelector(".income_expense") as HTMLElement;

const displayer = Displayer(
    getBalance, balanceInputField, balanceList, notification, addBalance, oldest, newest, incomeTotal,
    expenseTotal, income_expense
);

function init(): void {
    displayer.initEventListeners();
}

function teardown(): void {
    displayer.cleanup();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);