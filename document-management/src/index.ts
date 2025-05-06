import DataStorages from "./storage.js";

type DocumentItem = {
    id: string;
    name: string;
    content: string;
    type:string;
}

const dataStorages = DataStorages<DocumentItem>("docx-item");
let controller: AbortController = new AbortController();

const uploadDocxSection = document.getElementById("upload-doc-section") as HTMLFormElement;
const documentsList = document.getElementById("documents-list") as HTMLElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const preview = document.getElementById("preview") as HTMLImageElement;

function initEventListeners(): void {
    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement
        const getAllDocxData = Array.from(document.querySelectorAll(".document-list"));
        const selectButton = target.closest(".select-button");
        const deleteButton = target.closest(".delete-button");

        const getSelectedComponent = selectButton?.closest(".document-list");
        const deleteSelectedComponents = deleteButton?.closest(".document-list");

        const getSelectedIndex = getAllDocxData.indexOf(getSelectedComponent as Element);
        const getIndexToRemove = getAllDocxData.indexOf(deleteSelectedComponents as Element);

        if (getSelectedIndex > -1) {
            const docxDetail = dataStorages.data[getSelectedIndex];
            DocxDisplayer.selectDocument(docxDetail.id);
        }
        if (getIndexToRemove > -1) {
            const docxDetail = dataStorages.data[getIndexToRemove];
            DocxDisplayer.deleteSelectedDocument(docxDetail.id);
        }
        if (target.closest("#delete-all-docxs")) DocxDisplayer.deleteAllDocuments();
    }, { signal: controller.signal });

    fileInput.addEventListener("change", (event) => DocxDisplayer.fileProcessing(event), {
        signal: controller.signal
    });

    uploadDocxSection.addEventListener("submit", (event) => DocxDisplayer.submitDocument(event), {
        signal: controller.signal
    });
}

const DocxDisplayer = {
    maxSize: 5 * 1024 * 1024 as number,
    selectedDocxId: null as string | null,

    displayAllDocuments(): void {
        const docxFragment = document.createDocumentFragment();
        const data = dataStorages.data;

        if (data.length > 0) {
            data.forEach(dt => docxFragment.appendChild(this.createDocxComponent(dt)));
        } else {
            console.log("Dokumen kosog");
        }

        documentsList.innerHTML = '';
        documentsList.appendChild(docxFragment);
    },
    
    fileProcessing(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onloadend = (event) => preview.src = event.target?.result as string;
            reader.readAsDataURL(file);
        }
    },

    submitDocument(event: SubmitEvent): void {
        event.preventDefault();

        const newData = {}

        if (this.selectedDocxId === null) {
            dataStorages.addToStorage(newData as Omit<DocumentItem, 'id'>);
        } else {
            dataStorages.changeSelectedData(this.selectedDocxId, newData);
        }

        this.resetForm();
    },

    showPreviewDocs(id: string): void {},

    createDocxComponent(docx: DocumentItem): HTMLDivElement {
        const doc = document.createElement("div") as HTMLDivElement;
        doc.className = "document-list";

        const docxName = document.createElement("div") as HTMLDivElement;
        docxName.className = "document-name";
        docxName.textContent = docx.name;

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-button";
        deleteBtn.textContent = "Delete";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.className = "select-button";
        selectBtn.className = "select-button";
        selectBtn.textContent = "Select";

        const previewBtn = document.createElement("button") as HTMLButtonElement;
        previewBtn.className = "preview-button";
        deleteBtn.className = "preview-button";
        deleteBtn.textContent = "Preview";

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";
        buttonWrap.append(selectBtn, deleteBtn, previewBtn);

        doc.append(docxName, buttonWrap);
        return doc;
    },

    resetForm(): void {
        uploadDocxSection.reset();
        this.selectedDocxId = null;
    },

    selectDocument(id: string): void {},

    deleteSelectedDocument(id: string): void {
        dataStorages.deleteSelectedData(id);

        if (this.selectedDocxId === id) this.resetForm();

        this.displayAllDocuments();
    },

    deleteAllDocuments(): void {
        if (dataStorages.data.length > 0) {
            dataStorages.deleteAllData();
            documentsList.replaceChildren();
            this.resetForm();
        } else {
            alert("Data masih kosong");
        }
        this.displayAllDocuments();
    },
}

function init(): void {
    DocxDisplayer.displayAllDocuments();
    initEventListeners();
}

function teardown(): void {
    DocxDisplayer.resetForm();
    controller.abort();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);