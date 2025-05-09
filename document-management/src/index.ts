import DataStorages from "./storage.js";
import Modal from "./modal.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type FileItem = {
    id: string;
    fileName: string;
    uploaderName: string;
    fileUrl: string;
    uploadDate: Date;
    fileType: string;
}

const dataStorages = DataStorages<FileItem>("file-item");
const storage = getStorage(); // Inisialisasi Firebase Storage
let controller: AbortController = new AbortController();

const uploadDocxSection = document.getElementById("upload-doc-section") as HTMLFormElement;
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const username = document.getElementById("username") as HTMLInputElement;
const preview = document.getElementById("preview") as HTMLDivElement;
const documentsList = document.getElementById("documents-list") as HTMLElement;
const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;

function initEventListeners(): void {
    document.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;
        
        if (target.closest(".select-button")) {
            const card = target.closest(".document-card");
            const id = card?.getAttribute("data-id");
            if (id) Displayer.selectFile(id);
        }
        
        if (target.closest(".delete-button")) {
            const card = target.closest(".document-card");
            const id = card?.getAttribute("data-id");
            if (id) await Displayer.deleteSelectedFile(id);
        }
        
        if (target.closest("#delete-all-docxs")) await Displayer.deleteAllFiles();
        if (target.closest("#reset-form")) Displayer.resetForm();
    }, { signal: controller.signal });

    fileInput.addEventListener("change", (event) => Displayer.changeFileToUrl(event), {
        signal: controller.signal
    });

    uploadDocxSection.addEventListener("submit", (event) => Displayer.handleSubmit(event), {
        signal: controller.signal
    });
}

const Displayer = {
    selectedFileId: null as string | null,
    currentFile: null as File | null,
    currentFileDataUrl: "",

    async showAllFiles(): Promise<void> {
        try {
            const files = await dataStorages.loadFromStorage();
            const fileDataFragment = document.createDocumentFragment();
        
            files.forEach(data => {
                fileDataFragment.appendChild(this.createFileListComponents(data));
            });
        
            documentsList.innerHTML = '';
            documentsList.appendChild(fileDataFragment);
        } catch (error) {
            Modal.createModal("Error loading files");
        }
    },

    changeFileToUrl(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] || null; 
        this.currentFile = file;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = (event) => {
                this.currentFileDataUrl = event.target?.result as string;
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `<img src="${this.currentFileDataUrl}" alt="Preview">`;
                } else {
                    preview.textContent = file.name;
                }
            };
            reader.readAsDataURL(file);
        }
    },

    async handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        
        if (!this.currentFile) {
            Modal.createModal("Please select a file!");
            return;
        }

        try {
            // Upload file ke Firebase Storage
            const storageRef = ref(storage, `documents/${Date.now()}_${this.currentFile.name}`);
            const snapshot = await uploadBytes(storageRef, this.currentFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Membuat objek FileItem
            const newFile: Omit<FileItem, 'id'> = {
                fileName: this.currentFile.name,
                uploaderName: username.value || `user_${Date.now()}`,
                fileUrl: downloadURL,
                uploadDate: new Date(),
                fileType: this.currentFile.type
            };

            if (this.selectedFileId) {
                await dataStorages.changeSelectedData(this.selectedFileId, newFile);
            } else {
                await dataStorages.addToStorage(newFile);
            }

            await this.showAllFiles();
            this.resetForm();
        } catch (error) {
            Modal.createModal("Error uploading file");
        }
    },

    createFileListComponents(detail: FileItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'document-card';
        card.setAttribute('data-id', detail.id);

        const fileName = document.createElement("h3");
        fileName.className = "file-name";
        fileName.textContent = `File: ${detail.fileName}`;

        const documentMeta = document.createElement('div');
        documentMeta.className = "document-meta";

        const uploaderName = document.createElement("p");
        uploaderName.className = "uploader-name";
        uploaderName.textContent = `Uploaded by: ${detail.uploaderName}`;

        const uploadTime = document.createElement("p");
        uploadTime.className = "date-time";
        uploadTime.textContent = detail.uploadDate.toLocaleDateString();

        const documentAction = document.createElement('div');
        documentAction.className = "document-action";

        const selectButton = document.createElement("button");
        selectButton.className = "select-button";
        selectButton.textContent = "Select";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        documentMeta.append(uploaderName, uploadTime);
        documentAction.append(selectButton, deleteButton);

        card.append(this.fileIcon(detail), fileName, documentMeta, documentAction);
        card.addEventListener("click", (e) => {
            if (!(e.target as Element).closest('.document-action button')) {
                this.openDocument(detail);
            }
        });

        return card;
    },
    
    openDocument(selectedData: FileItem): void {
        window.open(selectedData.fileUrl, '_blank');
    },

    fileIcon(file: FileItem): HTMLElement {
        const icon = document.createElement("i") as HTMLElement;
        if (file.fileName.includes(".pdf")) icon.className = "fa-solid fa-file-pdf";
        else if (file.fileName.includes(".txt")) icon.className = "fa-solid fa-file-lines";
        else if (file.fileName.includes(".doc")) icon.className = "fa-solid fa-file-word";
        else if (file.fileName.includes(".docx")) icon.className = "fa-solid fa-file-word";
        else if (file.fileName.includes(".jpg")) icon.className = "fa-solid fa-image";
        else if (file.fileName.includes(".jpeg")) icon.className = "fa-solid fa-image";
        else if (file.fileName.includes(".png")) icon.className = "fa-solid fa-image";

        return icon;
    },

    async selectFile(id: string): Promise<void> {
        this.selectedFileId = id;
        const files = await dataStorages.loadFromStorage();
        const fileData = files.find(f => f.id === id);
        
        if (!fileData) return;
        
        username.value = fileData.uploaderName;
        this.showPreview(fileData); 
        submitButton.textContent = "Edit Data";
    },

    showPreview(detail: FileItem): void {
        preview.innerHTML = detail.fileType.startsWith('image/') ? 
            `<img src="${detail.fileUrl}" alt="${detail.fileName}">` : 
            `<div class="file-preview">${detail.fileName}</div>`;
    },

    async deleteSelectedFile(id: string): Promise<void> {
        try {
            await dataStorages.deleteSelectedData(id);
            if (this.selectedFileId === id) this.resetForm();
            await this.showAllFiles();
        } catch (error) {
            Modal.createModal("Error deleting file");
        }
    },

    async deleteAllFiles(): Promise<void> {
        try {
            await dataStorages.deleteAllData();
            documentsList.replaceChildren();
            this.resetForm();
        } catch (error) {
            Modal.createModal("Error deleting files");
        }
    },

    resetForm(): void {
        this.selectedFileId = null;
        this.currentFile = null;
        this.currentFileDataUrl = "";
        fileInput.value = "";
        username.value = "";
        preview.innerHTML = "";
        submitButton.textContent = "Add Data";
    }
};

function init(): void {
    initEventListeners();
    Displayer.showAllFiles();
    dataStorages.subscribe((files) => {
        Displayer.showAllFiles();
    });
}

function teardown(): void {
    controller.abort();
    Modal.teardown();
    Displayer.resetForm();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);