import DisplayManager from './handler';
import './style.css';

const inputSection = document.getElementById("inputSection") as HTMLFormElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const dynamicFields = document.getElementById("dynamicFields") as HTMLDivElement;

const searchSection = document.getElementById("searchSection") as HTMLFormElement;
const searchData = document.getElementById("searchData") as HTMLInputElement;

const itemsList = document.getElementById("itemsList") as HTMLElement;
const modalMessage = document.getElementById("modal-msg") as HTMLElement;
const errorNotification = document.getElementById("error-notification") as HTMLElement;

const displayer = new DisplayManager(
    inputSection, nameInput, dynamicFields, searchSection, searchData, itemsList,
    modalMessage, errorNotification
);

function init(): void {
    displayer.setEventListeners();
}

function cleanUp(): void {
    displayer.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);