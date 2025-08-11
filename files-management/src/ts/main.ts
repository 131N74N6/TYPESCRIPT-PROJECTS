import CloudStorage from './cloud-storage';

const fileUploaderForm = document.getElementById('upload-file-section') as HTMLFormElement;
const username = document.getElementById('username') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const preview = document.getElementById('preview') as HTMLDivElement;
const submitButton = document.getElementById('submit-btn') as HTMLButtonElement;
const navbar = document.getElementById('category-filter') as HTMLElement;
const searchedData = document.getElementById('searched-data') as HTMLInputElement;
const checkboxCategory = document.querySelectorAll<HTMLInputElement>('#category-filter input[type="checkbox"]');
const sortingData = document.getElementById('sorting-data') as HTMLSelectElement;
const documentsList = document.getElementById('documents-list') as HTMLElement;
const modal = document.getElementById('modal') as HTMLElement;
const fileViewer = document.getElementById('file-viewer') as HTMLElement;
const fileContent = document.getElementById('file-content') as HTMLElement;

const fileDataDisplayer = CloudStorage({
    fileUploaderForm: fileUploaderForm, fileInput: fileInput, documentsList: documentsList, 
    preview: preview, submitButton: submitButton, username: username, modal: modal, searchInput: searchedData, 
    checkboxCategory: checkboxCategory, sortingData: sortingData, navbar: navbar, fileViewer: fileViewer,
    fileContent: fileContent
});

async function init(): Promise<void> {
    await fileDataDisplayer.initCloudStorage();
}

function teardown(): void {
    fileDataDisplayer.cleanUpListener();
    fileDataDisplayer.resetForm();
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);