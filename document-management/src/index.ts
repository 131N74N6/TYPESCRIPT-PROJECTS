import DataStorages from "./storage.js";

type DocumentItem = {
    id: string;
    fileName: string;
    uploaderName: string;
    file: File | string;
    uploadDate: Date;
}

const dataStorages = DataStorages<DocumentItem>("docx-item");
let controller: AbortController = new AbortController();

const uploadDocxSection = document.getElementById("upload-doc-section") as HTMLFormElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const username = document.getElementById("username") as HTMLInputElement;
const preview = document.getElementById("preview") as HTMLDivElement;
const documentsList = document.getElementById("documents-list") as HTMLElement;

function initEventListeners(): void {
    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;

        if (target.closest("#delete-all-docxs")) Displayer.deleteAllFiles();
    }, { signal: controller.signal });

    uploadDocxSection.addEventListener("submit", (event) => Displayer.handleSubmit(event), {
        signal: controller.signal
    });
}

const Displayer = {
    selectedFileId: null as string | null,

    showAllFiles(): void {
        const listOfileData = dataStorages.data;
        const fileDataFragment = document.createDocumentFragment();

        listOfileData.forEach(data => fileDataFragment.appendChild(this.createFileListComponents(data)));

        documentsList.innerHTML = '';
        documentsList.appendChild(fileDataFragment);
    },

    handleSubmit(event: SubmitEvent): void {
        event.preventDefault();
        
        const newFile: Partial<DocumentItem> = {
            fileName: fileInput.files?.[0]?.name || '',
            uploaderName: username.value || `user_${Date.now()}`,
            file: fileInput.files?.[0] as File,
            uploadDate: new Date()
        }

        if (this.selectedFileId !== null) {
            dataStorages.changeSelectedData(this.selectedFileId, newFile);
        } else {
            dataStorages.addToStorage(newFile as Omit<DocumentItem, 'id'>);
        }

        this.showAllFiles();
        this.resetForm();
    },

    createFileListComponents(detail: DocumentItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.innerHTML = `
            <h3>${detail.fileName}</h3>
            <div class="document-meta">
                <p>Uploaded by: ${detail.uploaderName}</p>
                <p>${new Date(detail.uploadDate).toLocaleDateString()}</p>
            </div>
            <div class="document-actions">
                <button class="select-button">Edit</button>
                <button class="delete-button">Delete</button>
            </div>
        `;

        card.addEventListener('click', (event) => {
            if (!(event.target instanceof HTMLButtonElement)) {
                this.openDocument(detail);
            }
        }, { signal: controller.signal });

        return card;
    },

    selectFile(id: string): void {
        this.selectedFileId = id;
        const fileData = dataStorages.data.find(DATA => DATA.id === this.selectedFileId as string);

        if(!fileData) return;

        username.value = fileData?.uploaderName;
        const file = new File([], fileData.uploaderName, { 
            type: typeof fileData.file === 'string' ? 'application/octet-stream' : fileData.file.type 
        });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        const fileNameElement = fileInput.nextElementSibling?.querySelector('#file-name');
        if (fileNameElement) {
            fileNameElement.textContent = fileData.fileName;
        }

        this.showPreview();
    },

    async showPreview(): Promise<void> {
        preview.innerHTML = '';
        const file = fileInput.files?.[0];
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const showPreview = file.type.startsWith('image/') 
                    ? `<img src="${event.target?.result}" alt="Preview">`
                    : `<div class="file-preview">${file.name}</div>`;
                preview.innerHTML = showPreview;
            };
            reader.readAsDataURL(file);
        }
    },

    openDocument(doc: DocumentItem): void {
        const url = typeof doc.file === 'string' ? doc.file : URL.createObjectURL(doc.file);
        window.open(url, '_blank');
    },

    deleteSelectedFile(id: string): void {
        if (this.selectedFileId === id) this.resetForm();

        dataStorages.deleteSelectedData(id);
        this.showAllFiles();
    },

    deleteAllFiles(): void {
        if (dataStorages.data.length > 0) {
            this.resetForm();
            dataStorages.deleteAllData();
            documentsList.replaceChildren();
        } else {
            alert("There's no file uploaded!");
        }
        this.showAllFiles();
    },

    resetForm(): void {
        this.selectedFileId = null;
        uploadDocxSection.reset();
    }
}

function init(): void {
    initEventListeners();
    dataStorages.loadFromStorage();
    Displayer.showAllFiles();
}

function teardown(): void {
    controller.abort();
    Displayer.resetForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);