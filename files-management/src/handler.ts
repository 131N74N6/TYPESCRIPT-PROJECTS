import DataStorages from "./storage";
import Modal from "./modal";
import supabase from "./supabase-config";
import uploadToSupabaseStorage from "./supabase-bucket";

type FileItem = {
    id: number;
    created_at: Date;
    uploader_name: string;
    file_name: string;
    file_type: string;
    file_url: string;
}

const dataStorages = DataStorages<FileItem>("files_list");
const storageName = "file-example";

const Displayer = (
    fileUploaderForm: HTMLFormElement, fileInput: HTMLInputElement, documentsList: HTMLElement,
    preview: HTMLDivElement, submitButton: HTMLButtonElement, username: HTMLInputElement, 
    modal: HTMLElement, ascSortingCheckbox: HTMLInputElement, dscSortingCheckbox: HTMLInputElement, 
    searchFileSection: HTMLFormElement, searchInput: HTMLInputElement, features: HTMLElement,
    checkboxCategory: NodeListOf<HTMLInputElement>
) => ({
    setModal: Modal(modal),
    controller: new AbortController() as  AbortController,
    selectedFileId: null as number | null,
    currentFile: null as File | null,
    currentFileDataUrl: "",
    selectedCategories: [
        "application/pdf", "image/jpg", "image/jpeg", "image/png", "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ] as string[],

    initEventListeners(): void {
        dataStorages.realtimeInit(() => {
            this.showAllFiles();
        });
        
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-files")) await this.deleteAllFiles();
            else if (target.closest("#show-form")) this.openForm();
            else if (target.closest("#show-search-form")) this.openSearchForm();
            else if (target.closest("#reset-form")) this.closeForm();
            else if (target.closest("#reset-search")) this.closeSearchForm();
            else if (target.closest("#preview")) fileInput.click();
            else if (target.closest("#open-features")) this.openFeatures();
            else if (target.closest("#close-features")) this.closeFeatures();
        }, { signal: this.controller.signal });

        documentsList.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            const fileCard = target.closest(".file-card") as HTMLElement | null;
            if (!fileCard) return; 

            const fileId = parseInt(fileCard.dataset.id || '', 10);
            if (isNaN(fileId)) {
                this.setModal.createModal("File ID not found or invalid on clicked card.");
                this.setModal.showMessage();
                return;
            }

            if (target.closest(".select-button")) {
                this.selectFile(fileId);
            } else if (target.closest(".delete-button")) {
                await this.deleteSelectedFile(fileId);
            } else {
                // Jika klik bukan pada tombol select/delete tapi di dalam card
                const fileData = dataStorages.currentData.find(f => f.id === fileId);
                if (fileData) {
                    this.openDocument(fileData);
                }
            }
        }, { signal: this.controller.signal });

        fileInput.addEventListener("change", (event) => this.changeFileToUrl(event), {
            signal: this.controller.signal
        });

        searchFileSection.addEventListener("submit", (event) => this.searchedData(event), {
            signal: this.controller.signal
        });

        fileUploaderForm.addEventListener("submit", (event) => this.handleSubmit(event), {
            signal: this.controller.signal
        });

        ascSortingCheckbox.addEventListener("change", () => {
            dscSortingCheckbox.checked = false;
            this.showAllFiles();
        }, { signal: this.controller.signal });

        dscSortingCheckbox.addEventListener("change", () => {
            ascSortingCheckbox.checked = false;
            this.showAllFiles();
        }, { signal: this.controller.signal });

        checkboxCategory.forEach(checkbox => {
            checkbox.addEventListener("change", () => {
                this.selectedCategories = Array.from(checkboxCategory)
                .filter(selected => selected.checked)
                .map(get_value => get_value.value as FileItem['file_type']);
                this.showAllFiles();
            }, { signal: this.controller.signal });
        });
    },

    async showAllFiles(): Promise<void> {
        const fileDataFragment = document.createDocumentFragment();

        try {
            if (dataStorages.currentData.length > 0) {
                const filteredData = dataStorages.currentData.filter(data => this.selectedCategories.includes(data.file_type));
                let sortedData = filteredData;

                if (ascSortingCheckbox.checked) {
                    sortedData = [...filteredData].sort(
                        (a: FileItem, b: FileItem) => a.file_name.localeCompare(b.file_name)
                    );
                }

                if (dscSortingCheckbox.checked) {
                    sortedData = [...filteredData].sort(
                        (a: FileItem, b: FileItem) => b.file_name.localeCompare(a.file_name)
                    );
                }

                sortedData.forEach(
                    data => fileDataFragment.appendChild(this.createFileListComponents(data))
                );
        
                documentsList.innerHTML = '';
                documentsList.appendChild(fileDataFragment);
            } else {
                const empty = document.createElement("div") as HTMLDivElement;
                empty.className = "empty";
                empty.textContent = "No file added..";

                documentsList.innerHTML = '';
                documentsList.appendChild(empty);
            }
        } catch (error) {
            const errorMsg = document.createElement("div") as HTMLDivElement;
            errorMsg.className = "internal-error";
            errorMsg.textContent = "Internal server error";
            fileDataFragment.appendChild(errorMsg);

            documentsList.innerHTML = '';
            documentsList.appendChild(fileDataFragment);
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
        
        if (!this.currentFile && this.selectedFileId === null) {
            this.setModal.createModal("Please select a file!");
            this.setModal.showMessage();
            return;
        }

        try {
            let uploadDate: Date;
            let fileUrl: string = '';
            let newFileName: string = '';
            let newFileType: string = '';

            if (this.selectedFileId) {
                // Mode Edit Data
                const existingFileItem = dataStorages.currentData.find(f => f.id === this.selectedFileId);

                if (!existingFileItem) {
                    throw new Error("Existing file data not found for editing.");
                }
                // Cek apakah ada file baru yang dipilih (currentFile tidak null)
                if (this.currentFile) {
                    // Ada file baru, hapus file lama dari storage
                    const oldFilePath = existingFileItem.file_url.split(`${storageName}/`)[1];
                    if (oldFilePath) {
                        const { error: removeError } = await supabase.storage
                        .from(storageName)
                        .remove([decodeURIComponent(oldFilePath)]);

                        if (removeError) {
                            this.setModal.createModal(`Error removing old file from storage: ${removeError}`);
                            this.setModal.showMessage();
                            // Lanjutkan saja, mungkin file lama sudah tidak ada
                        }
                    }

                    // Upload file baru
                    uploadDate = existingFileItem.created_at;
                    fileUrl = await uploadToSupabaseStorage(this.currentFile, storageName);
                    newFileName = this.currentFile.name;
                    newFileType = this.currentFile.type;
                } else {
                    // Tidak ada file baru yang dipilih, gunakan URL file yang sudah ada
                    uploadDate = existingFileItem.created_at;
                    fileUrl = existingFileItem.file_url;
                    newFileName = existingFileItem.file_name;
                    newFileType = existingFileItem.file_type;
                }
            } else {
                // Mode Tambah Data Baru
                if (!this.currentFile) { // Pastikan ada file jika mode tambah
                    this.setModal.createModal("Please select a file to upload!");
                    this.setModal.showMessage();
                    return;
                }
                
                uploadDate = new Date();
                fileUrl = await uploadToSupabaseStorage(this.currentFile, storageName);
                newFileName = this.currentFile.name;
                newFileType = this.currentFile.type;
            }

            const newFile: Omit<FileItem, 'id'> = {
                created_at: uploadDate, // Mungkin Anda ingin menjaga created_at yang asli untuk edit, atau update ke waktu sekarang
                uploader_name: username.value || `user_${Date.now()}`,
                file_name: newFileName,
                file_type: newFileType,
                file_url: fileUrl
            }

            if (this.selectedFileId) {
                await dataStorages.changeSelectedData(this.selectedFileId, newFile);
            } else {
                await dataStorages.addToStorage(newFile);
            }
        } catch (error) {
            this.setModal.createModal("Error uploading file");
            this.setModal.showMessage();
            this.resetForm();
        } finally {
            this.resetForm();
            fileUploaderForm.classList.remove("show");
        }
    },

    createFileListComponents(detail: FileItem): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.id = detail.id.toString();

        const file_name = document.createElement("h3");
        file_name.className = "file-name";
        file_name.textContent = `File: ${detail.file_name}`;

        const documentMeta = document.createElement('div');
        documentMeta.className = "document-meta";

        const uploader_name = document.createElement("p");
        uploader_name.className = "uploader-name";
        uploader_name.textContent = `Uploaded by: ${detail.uploader_name}`;

        const uploadTime = document.createElement("p");
        uploadTime.className = "date-time";
        uploadTime.textContent = `Uploaded at: ${detail.created_at.toLocaleString()}`;

        const documentAction = document.createElement('div');
        documentAction.className = "document-action";

        const selectButton = document.createElement("button");
        selectButton.className = "select-button";
        selectButton.textContent = "Select";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        documentMeta.append(uploader_name, uploadTime);
        documentAction.append(selectButton, deleteButton);
        
        const fileIconElement = this.fileIcon(detail); 
        card.append(fileIconElement, file_name, documentMeta, documentAction); 

        return card;
    },
    
    openDocument(selectedData: FileItem): void {
        window.open(selectedData.file_url, '_blank');
    },

    searchedData(event: SubmitEvent): void {
        event.preventDefault();
        const trimmedValue = (searchInput.value.trim()).toLowerCase();
        if (trimmedValue === "") {
            this.setModal.createModal("Please insert some text");
            this.setModal.showMessage();
        }
        const searched = dataStorages.currentData.filter(data => data.file_name.includes(trimmedValue));
        this.showSearchedData(searched);
    },

    showSearchedData(searched: FileItem[]): void {
        const filterFragment = document.createDocumentFragment();
        searched.forEach(data => {
            const filteredElement = this.createFileListComponents(data);
            filterFragment.appendChild(filteredElement);
        });
        documentsList.innerHTML = '';
        documentsList.appendChild(filterFragment);
    },

    fileIcon(file: FileItem): HTMLElement {
        const icon = document.createElement("i") as HTMLElement;
        if (file.file_name.includes(".pdf")) icon.className = "fa-solid fa-file-pdf";
        else if (file.file_name.includes(".txt")) icon.className = "fa-solid fa-file-lines";
        else if (file.file_name.includes(".doc")) icon.className = "fa-solid fa-file-word";
        else if (file.file_name.includes(".docx")) icon.className = "fa-solid fa-file-word";
        else if (file.file_name.includes(".jpg")) icon.className = "fa-solid fa-image";
        else if (file.file_name.includes(".jpeg")) icon.className = "fa-solid fa-image";
        else if (file.file_name.includes(".png")) icon.className = "fa-solid fa-image";

        return icon;
    },

    selectFile(id: number): void {
        this.openForm();
        this.selectedFileId = id;
        const fileData = dataStorages.currentData.find(f => f.id === id);
        
        if (!fileData) return;
        
        username.value = fileData.uploader_name;
        this.showPreview(fileData); 
        submitButton.textContent = "Edit Data";
    },

    showPreview(detail: FileItem): void {
        preview.innerHTML = detail.file_type.startsWith('image/') ? 
            `<img src="${detail.file_url}" alt="${detail.file_name}">` : 
            `<div class="file-preview">${detail.file_name}</div>`;
    },

    async deleteSelectedFile(id: number): Promise<void> {
        try {
            if (dataStorages.currentData.length > 0) {
                const fileToDelete = dataStorages.currentData.find(f => f.id === id);

                if (fileToDelete) {
                    // Ekstrak path file dari URL
                    const filePath = fileToDelete.file_url.split(`${storageName}/`)[1];
                    if (filePath) {
                        const { error: storageError } = await supabase.storage
                        .from(storageName)
                        .remove([decodeURIComponent(filePath)]); // Gunakan decodeURIComponent untuk path yang mungkin diencode

                        if (storageError) {
                            console.log(`Error deleting file from storage: ${storageError}`);
                            this.setModal.createModal(`Error deleting file from storage: ${storageError}`);
                            this.setModal.showMessage();
    
                            // Anda bisa memilih untuk melempar error atau hanya log,
                            // tergantung seberapa penting konsistensi storage vs database.
                            // Untuk saat ini, kita tetap lanjutkan menghapus dari DB.
                        }
                    }
                }

                await dataStorages.deleteSelectedData(id);
                if (this.selectedFileId === id) this.resetForm();
                await this.showAllFiles();
            } else {    
                this.setModal.createModal("Please add one file");
                this.setModal.showMessage();
            }
        } catch (error) {
            this.setModal.createModal("Error deleting file");
            this.setModal.showMessage();
        }
    },

    async deleteAllFiles(): Promise<void> {
        try {
            if (dataStorages.currentData.length > 0) {
                // Kumpulkan semua path file yang akan dihapus dari storage
                const filePathsToDelete: string[] = [];
                dataStorages.currentData.forEach(fileItem => {
                    const filePath = fileItem.file_url.split(`${storageName}/`)[1];
                    if (filePath) {
                        filePathsToDelete.push(decodeURIComponent(filePath));
                    }
                });

                if (filePathsToDelete.length > 0) {
                    const { error: storageError } = await supabase.storage
                    .from(storageName)
                    .remove(filePathsToDelete);

                    if (storageError) {
                        console.log(`Error deleting all files from storage: ${storageError}`);
                        this.setModal.createModal(`Error deleting all files from storage: ${storageError}`);
                        this.setModal.showMessage();
                    }
                }

                await dataStorages.deleteAllData();
                dataStorages.currentData = [];
                documentsList.replaceChildren();
                this.resetForm();
            } else {    
                this.setModal.createModal("Please add one file");
                this.setModal.showMessage();
            }
        } catch (error) {
            this.setModal.createModal(`Error deleting all files: ${error}`);
            this.setModal.showMessage();
        }
        this.showAllFiles();
    },

    openForm(): void {
        searchFileSection.classList.remove("show");
        fileUploaderForm.classList.add("show");
        features.classList.remove("show");
        searchFileSection.reset();
        this.showAllFiles();
    },

    closeForm(): void {
        features.classList.remove("show");
        fileUploaderForm.classList.remove("show");
        this.resetForm();
    },

    openSearchForm(): void {
        fileUploaderForm.classList.remove("show");
        searchFileSection.classList.add("show");
        features.classList.remove("show");
        this.resetForm();
    },

    closeSearchForm(): void {
        searchFileSection.classList.remove("show");
        searchFileSection.reset();
        this.showAllFiles();
    },

    openFeatures(): void {
        fileUploaderForm.classList.remove("show");
        searchFileSection.classList.remove("show");
        features.classList.add("show");
        this.selectedFileId = null;
        this.showAllFiles();
    },

    closeFeatures(): void {
        fileUploaderForm.classList.remove("show");
        searchFileSection.classList.remove("show");
        features.classList.remove("show");
        this.selectedFileId = null;
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
        dataStorages.currentData = [];
    }
});

export default Displayer;