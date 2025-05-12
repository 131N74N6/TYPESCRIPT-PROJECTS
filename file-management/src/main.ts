import Displayer from './displayer.js';
import './style.css';

const app = document.querySelector("#app") as HTMLElement;

// header
const header = document.createElement("header") as HTMLElement;
header.id = "header";

const deleteAllButton = document.createElement("button") as HTMLButtonElement;
deleteAllButton.type = "button";
deleteAllButton.id = "delete-all-files";
deleteAllButton.textContent = "Delete All";
deleteAllButton.style.display = "flex";
deleteAllButton.style.gap = "0.5rem";

const deleteAllIcon = document.createElement("i") as HTMLElement;
deleteAllIcon.className = "fa-solid fa-trash";

deleteAllButton.prepend(deleteAllIcon);

// <div class="sorting-container"></div>
const sortingContainer = document.createElement("div");
sortingContainer.className = "sorting-container";
sortingContainer.style.display = "flex";
sortingContainer.style.gap = "1rem";

const ascSortingLabel = document.createElement("label");
ascSortingLabel.style.display = "flex";
ascSortingLabel.style.gap = "0.5rem";
ascSortingLabel.style.alignItems = "center";

const ascSortingCheckbox = document.createElement("input");
ascSortingCheckbox.type = "checkbox";
ascSortingCheckbox.id = "asc-sorting";
ascSortingCheckbox.className = "sorting-checkbox";

const ascSortingText = document.createElement("span");
ascSortingText.textContent = "A-Z";

const ascIcon = document.createElement("i") as HTMLElement;
ascIcon.className = "fa-solid fa-sort-up";

ascSortingLabel.prepend(ascIcon);
ascSortingLabel.append(ascSortingCheckbox, ascSortingText);

const dscSortingLabel = document.createElement("label");
dscSortingLabel.style.display = "flex";
dscSortingLabel.style.gap = "0.5rem";
dscSortingLabel.style.alignItems = "center";

const dscSortingCheckbox = document.createElement("input");
dscSortingCheckbox.type = "checkbox";
dscSortingCheckbox.id = "dsc-sorting";
dscSortingCheckbox.className = "sorting-checkbox";

const dscSortingText = document.createElement("span");
dscSortingText.textContent = "Z-A";

const dscIcon = document.createElement("i") as HTMLElement;
dscIcon.className = "fa-solid fa-sort-down";

dscSortingLabel.prepend(dscIcon)
dscSortingLabel.append(dscSortingCheckbox, dscSortingText);

sortingContainer.append(ascSortingLabel, dscSortingLabel);
header.append(deleteAllButton, sortingContainer);

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
preview.textContent = "Click here to upload your file";

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
    errorMessages, fileUploaderForm, fileInput, documentsList, preview, submitButton, username, 
    modal, ascSortingCheckbox, dscSortingCheckbox
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