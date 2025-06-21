import Displayer from './handler';

const fileUploaderForm = document.getElementById('upload-file-section') as HTMLFormElement;
const username = document.getElementById('username') as HTMLInputElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const preview = document.getElementById('preview') as HTMLDivElement;
const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;

const searchedData = document.getElementById('searched-data') as HTMLInputElement;
const checkboxCategory = document.querySelectorAll<HTMLInputElement>('#category-filter input[type="checkbox"]');
const sortingData = document.getElementById('sorting-data') as HTMLSelectElement;
const documentsList = document.getElementById('documents-list') as HTMLElement;
const modal = document.getElementById('modal') as HTMLElement;

const fileDataDisplayer = Displayer(
    fileUploaderForm, fileInput, documentsList, preview, submitButton, username, modal, 
    searchedData, checkboxCategory, sortingData
);

async function init(): Promise<void> {
    await fileDataDisplayer.initDisplayer();
}

function teardown(): void {
    fileDataDisplayer.cleanUpListener();
    fileDataDisplayer.resetForm();
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);