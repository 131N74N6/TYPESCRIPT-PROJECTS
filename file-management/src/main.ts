import Displayer from './displayer.js';
import './style.css';

const app = document.querySelector("#app") as HTMLElement;

const header = document.createElement("header") as HTMLElement;
header.id = "header";

const deleteAllButton = document.createElement("button") as HTMLButtonElement;
deleteAllButton.type = "button";
deleteAllButton.id = "delete-all-files";
deleteAllButton.textContent = "Delete All";

const deleteAllIcon = document.createElement("i") as HTMLElement;
deleteAllIcon.className = "fa-solid fa-trash";
deleteAllIcon.style.transform = "translateX(15px)";

deleteAllButton.appendChild(deleteAllIcon);

const ascSortingButton = document.createElement("button") as HTMLButtonElement;
ascSortingButton.className = "asc-sorting";
ascSortingButton.textContent = "Sorting Up";

const ascSortingIcon = document.createElement("i") as HTMLElement;
ascSortingIcon.className = "fa-solid fa-sort-up";
ascSortingIcon.style.transform = "translateX(15px)";

ascSortingButton.appendChild(ascSortingIcon);

header.append(deleteAllButton, ascSortingButton);

const modal = document.createElement("section") as HTMLElement;
modal.id = "modal";

const container = document.createElement("main") as HTMLElement;
container.className = "container";

const fileUploaderForm = document.createElement("form") as HTMLFormElement;
fileUploaderForm.id = "upload-file-section";
fileUploaderForm.title = "upload-section";

const username = document.createElement("input") as HTMLInputElement;
username.type = "text";
username.id = "username";
username.placeholder = "input-your-username...";
username.autocomplete = "username";

const fileInput = document.createElement("input") as HTMLInputElement;
fileInput.id = "file-input";
fileInput.type = "file";
fileInput.title = "file";
fileInput.accept = ".pdf,.doc,.docx,.txt,.jpg,.png,.jpeg";

const preview = document.createElement("div") as HTMLDivElement;
preview.id = "preview";

const fileName = document.createElement("div") as HTMLDivElement;
fileName.id = "fileName";

const buttonWrap = document.createElement("div") as HTMLDivElement;
buttonWrap.className = "button-wrap";

const submitButton = document.createElement("button") as HTMLButtonElement;
submitButton.type = "submit";
submitButton.id = "submit-btn";
submitButton.textContent = "Add File";

const resetFileForm = document.createElement("button") as HTMLButtonElement;
resetFileForm.id = "reset-form";
resetFileForm.type = "button";
resetFileForm.textContent = "Reset Form";

buttonWrap.append(resetFileForm, submitButton);
fileUploaderForm.append(username, fileInput, preview, fileName, buttonWrap);

const documentsList = document.createElement("section") as HTMLElement;
documentsList.className = "documents-list";
documentsList.id = "documents-list";

const errorMessages = document.createElement("div") as HTMLDivElement;
errorMessages.className = "error-message";

container.append(modal, fileUploaderForm, documentsList, errorMessages);
app.append(header, container);

const fileDataDisplayer = Displayer(
    errorMessages, fileUploaderForm, fileInput, documentsList, preview, submitButton, username, modal
);

function init(): void {
    fileDataDisplayer.initEventListeners();
    fileDataDisplayer.showAllFiles();
}

function teardown(): void {
    fileDataDisplayer.cleanUpListener();
    fileDataDisplayer.resetForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);