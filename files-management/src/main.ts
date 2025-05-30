import Displayer from "./handler";

const fileUploaderForm = document.getElementById("upload-file-section") as HTMLFormElement;
const username = document.getElementById("username") as HTMLInputElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const preview = document.getElementById("preview") as HTMLDivElement;
const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;

const searchFileSection = document.getElementById("search-file-section") as HTMLFormElement;
const searchedData = document.getElementById("searched-data") as HTMLInputElement;
const checkboxCategory = document.querySelectorAll<HTMLInputElement>('.wrapper input[type="checkbox"]');

const ascSortingCheckbox = document.getElementById("asc-sorting") as HTMLInputElement;
const dscSortingCheckbox = document.getElementById("dsc-sorting") as HTMLInputElement;
const documentsList = document.getElementById("documents-list") as HTMLElement;

const modal = document.getElementById("modal") as HTMLElement;
const features = document.getElementById("features-list") as HTMLElement;

const fileDataDisplayer = Displayer(
    fileUploaderForm, fileInput, documentsList, preview, submitButton, username, modal, 
    ascSortingCheckbox, dscSortingCheckbox, searchFileSection, searchedData, features,
    checkboxCategory
);

function init(): void {
    fileDataDisplayer.initEventListeners();
}

function teardown(): void {
    fileDataDisplayer.cleanUpListener();
    fileDataDisplayer.resetForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);