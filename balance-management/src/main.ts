import Displayer from './handler';
import './style.css';

const getBalance = document.getElementById("balance") as HTMLInputElement;
const balanceInputField = document.getElementById("balance-input-field") as HTMLFormElement;
const balanceList = document.getElementById("balance-list") as HTMLElement;
const notification = document.getElementById("notification") as HTMLElement;

const displayer = Displayer(getBalance, balanceInputField, balanceList, notification);

function init(): void {
    displayer.initEventListeners();
}

document.addEventListener("DOMContentLoaded", init);