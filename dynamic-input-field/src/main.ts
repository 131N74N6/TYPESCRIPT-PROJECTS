import DisplayManager from './handler';
import './style.css';

const inputSection = document.getElementById("inputSection") as HTMLFormElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const dynamicFields = document.getElementById("dynamicFields") as HTMLDivElement;

const searchSection = document.getElementById("searchSection") as HTMLFormElement;
const searchData = document.getElementById("searchData") as HTMLInputElement;

const itemsList = document.getElementById("itemsList") as HTMLElement;

const displayer = new DisplayManager(inputSection, nameInput, dynamicFields, searchSection, searchData, itemsList);

function init(): void {
    displayer.showAllData();
}

function teardown(): void {
    displayer.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);