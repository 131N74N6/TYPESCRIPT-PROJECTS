import DataStorages from "./storage.js";
import Modal from "./modal.js";
import uploadToCloudinary from "./utilities/cloudinary-saver.js";

type FileItem = {
    id: string;
    fileName: string;
    uploaderName: string;
    fileUrl: string;
    uploadDate: Date;
    fileType: string;
    publicId?: string;
}

const dataStorages = DataStorages<FileItem>("file and users");

const Displayer = (
    errorMessage: HTMLDivElement, fileUploaderForm: HTMLFormElement, fileInput: HTMLInputElement, 
    documentsList: HTMLElement, preview: HTMLDivElement, submitButton: HTMLButtonElement, 
    username: HTMLInputElement, modal: HTMLElement, ascSortingCheckbox: HTMLInputElement, 
    dscSortingCheckbox: HTMLInputElement
) => ({
    setModal: Modal(modal),
    controller: new AbortController() as  AbortController,
    selectedFileId: null as string | null,
    currentFile: null as File | null,
    currentFileDataUrl: "",
    selectedCategories: [
        "application/pdf", "image/jpg", "image/jpeg", "image/png", "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ] as string[],

    initEventListeners(): void {
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            
            if (target.closest("#delete-all-files")) await this.deleteAllFiles();
            if (target.closest("#reset-form")) this.resetForm();
        }, { signal: this.controller.signal });

        fileInput.addEventListener("change", (event) => this.changeFileToUrl(event), {
            signal: this.controller.signal
        });

        fileUploaderForm.addEventListener("submit", (event) => this.handleSubmit(event), {
            signal: this.controller.signal
        });

        preview.addEventListener("click", () => fileInput.click(), { signal: this.controller.signal });

        ascSortingCheckbox.addEventListener("change", () => {
            dscSortingCheckbox.checked = false;
            this.showAllFiles();
        }, { signal: this.controller.signal });

        dscSortingCheckbox.addEventListener("change", () => {
            ascSortingCheckbox.checked = false;
            this.showAllFiles();
        }, { signal: this.controller.signal });
    },

    async showAllFiles(): Promise<void> {
        const fileDataFragment = document.createDocumentFragment();

        try {
            const files = await dataStorages.loadFromStorage();
            
            if (files.length > 0) {
                const filteredData = files.filter(data => this.selectedCategories.includes(data.fileType));
                const ascendChecked = ascSortingCheckbox.checked;
                const descendChecked = dscSortingCheckbox.checked;
                let sortedData = filteredData;

                if (ascendChecked) {
                    sortedData = [...filteredData].sort(
                        (a: FileItem, b: FileItem) => a.fileName.localeCompare(b.fileName)
                    );
                }

                if (descendChecked) {
                    sortedData = [...filteredData].sort(
                        (a: FileItem, b: FileItem) => b.fileName.localeCompare(a.fileName)
                    );
                }

                sortedData.forEach(
                    data => fileDataFragment.appendChild(this.createFileListComponents(data))
                );
        
                documentsList.innerHTML = '';
                documentsList.appendChild(fileDataFragment);
            } else {
                const emptyMsg = document.createElement("div") as HTMLDivElement;
                emptyMsg.className = "empty-data";
                emptyMsg.textContent = "No file added..";
                fileDataFragment.appendChild(emptyMsg);

                errorMessage.innerHTML = '';
                errorMessage.appendChild(fileDataFragment);
            }
        } catch (error) {
            const errorMsg = document.createElement("div") as HTMLDivElement;
            errorMsg.className = "internal-error";
            errorMsg.textContent = "Internal server error";
            fileDataFragment.appendChild(errorMsg);

            errorMessage.innerHTML = '';
            errorMessage.appendChild(fileDataFragment);
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
            }
            reader.readAsDataURL(file);
        }
    },

    async handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        
        if (!this.currentFile) {
            this.setModal.createModal("Please select a file!");
            return;
        }

        try {
            const cloudinaryResponse = await uploadToCloudinary(this.currentFile);

            const newFile: Omit<FileItem, 'id'> = {
                fileName: this.currentFile.name,
                uploaderName: username.value || `user_${Date.now()}`,
                fileUrl: cloudinaryResponse.secure_url,
                uploadDate: new Date(),
                fileType: this.currentFile.type,
                publicId: cloudinaryResponse.public_id
            }

            if (this.selectedFileId) {
                await dataStorages.changeSelectedData(this.selectedFileId, newFile);
            } else {
                await dataStorages.addToStorage(newFile);
            }

            await this.showAllFiles();
            this.resetForm();
        } catch (error) {
            this.setModal.createModal("Error uploading file");
            this.setModal.showMessage();
            this.resetForm();
        }
    },

    createFileListComponents(detail: FileItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'file-card';

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
        selectButton.addEventListener("click", async () => this.selectFile(detail.id), { 
            signal: this.controller.signal 
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => this.deleteSelectedFile(detail.id), { 
            signal: this.controller.signal 
        });

        documentMeta.append(uploaderName, uploadTime);
        documentAction.append(selectButton, deleteButton);

        card.append(this.fileIcon(detail), fileName, documentMeta, documentAction);
        card.addEventListener("click", (event) => {
            if (!(event.target as Element).closest('.document-action button')) {
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
            this.setModal.createModal("Error deleting file");
        }
    },

    async deleteAllFiles(): Promise<void> {
        try {
            await dataStorages.deleteAllData();
            documentsList.replaceChildren();
            this.resetForm();
        } catch (error) {
            this.setModal.createModal("Error deleting files");
        }
    },

    resetForm(): void {
        this.selectedFileId = null;
        this.currentFile = null;
        this.currentFileDataUrl = "";
        fileInput.value = "";
        username.value = "";
        preview.innerHTML = "Click here to upload your file";
        submitButton.textContent = "Add Data";
    },

    cleanUpListener(): void {
        this.controller.abort;
        this.setModal.teardown();
        this.resetForm();
        ascSortingCheckbox.checked = false;
        dscSortingCheckbox.checked = false;
    }
});

export default Displayer;