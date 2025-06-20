import DataStorages from './supabase-table';
import Modal from './modal';
import SupabaseStorage from './supabase-storage';

type FileItem = {
    id: number;
    created_at: Date;
    uploader_name: string;
    file_name: string;
    file_type: string;
    file_url: string;
}

const tableStorages = DataStorages<FileItem>('files_list');
const mediaStorage = SupabaseStorage();
const storageName = 'file-example';
let temp: FileItem[];

function Displayer (
    fileUploaderForm: HTMLFormElement, fileInput: HTMLInputElement, documentsList: HTMLElement,
    preview: HTMLDivElement, submitButton: HTMLButtonElement, username: HTMLInputElement, 
    modal: HTMLElement, searchInput: HTMLInputElement, checkboxCategory: NodeListOf<HTMLInputElement>,
    sortingData: HTMLSelectElement
) { 
    return {
        setModal: Modal(modal),
        controller: new AbortController() as  AbortController,
        selectedFileId: null as number | null,
        currentFile: null as File | null,
        currentFileDataUrl: '',
        selectedCategories: [
            'application/pdf', 'image/jpg', 'image/jpeg', 'image/png', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ] as string[],

        async initDisplayer(): Promise<void> {
            await tableStorages.realtimeInit((filesData) => {
                this.showAllFiles(filesData);
                temp = filesData;
            });
            
            fileInput.onchange = (event) => this.changeFileToUrl(event);
            fileUploaderForm.onsubmit = async (event) => await this.handleSubmit(event);
            searchInput.oninput = (event) => this.searchedData(event);
            
            document.addEventListener('click', async (event) => {
                const target = event.target as HTMLElement;
                if (target.closest('#delete-all-files')) await this.deleteAllFiles();
                else if (target.closest('#show-form')) this.openForm();
                else if (target.closest('#close-insert-form')) this.closeForm();
                else if (target.closest('#preview')) fileInput.click();
            }, { signal: this.controller.signal });

            sortingData.onchange = (event) => {
                const getValue = event.target as HTMLInputElement;
                switch (getValue.value) {
                    case 'from-A-Z': {
                        temp = [...temp].sort((a, b) => a.file_name.localeCompare(b.file_name));
                        this.showAllFiles(temp);
                        break;
                    }
                    case 'from-Z-A': {
                        temp = [...temp].sort((a, b) => b.file_name.localeCompare(a.file_name));
                        this.showAllFiles(temp);
                        break;
                    }
                    case 'from-newest': {
                        temp = [...temp].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
                        this.showAllFiles(temp);
                        break;
                    }
                    case 'from-oldest': {
                        temp = [...temp].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
                        this.showAllFiles(temp);
                        break;
                    }
                    default: {
                        this.showAllFiles(tableStorages.toArray());
                        break;
                    }
                }
            }

            checkboxCategory.forEach(checkbox => {
                checkbox.onchange = () => {
                    this.selectedCategories = Array.from(checkboxCategory)
                    .filter(selected => selected.checked)
                    .map(get_value => get_value.value as FileItem['file_type']);
                    this.showAllFiles(temp);
                }
            });
        },

        showAllFiles(filesData: FileItem[]): void {
            const fileDataFragment = document.createDocumentFragment();
            try {
                if (filesData.length > 0) {
                    const filteredData = filesData.filter(data => this.selectedCategories.includes(data.file_type));
                    let sortedData = filteredData;

                    sortedData.forEach(data => fileDataFragment.appendChild(this.createComponent(data)));
                    documentsList.innerHTML = '';
                    documentsList.appendChild(fileDataFragment);
                } else {
                    documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">No files added...</div>`;
                }
            } catch (error: any) {
                this.setModal.createModal(`Failed to load data: ${error.message || error}`);
                this.setModal.showMessage();
                documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">Error ${error.message || error}...</div>`;
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
                        preview.innerHTML = `<img src="${this.currentFileDataUrl}" class="w-[100%] h-[100%] object-cover" alt="Preview"/>`;
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
                this.setModal.createModal('Please select a file!');
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
                    const existingFileItem = tableStorages.currentData.get(this.selectedFileId);

                    if (!existingFileItem) {
                        throw new Error('Existing file data not found for editing.');
                    }
                    // Cek apakah ada file baru yang dipilih (currentFile tidak null)
                    if (this.currentFile) {
                        // Ada file baru, hapus file lama dari storage
                        await mediaStorage.RemoveFile(existingFileItem.file_url, storageName);

                        // Upload file baru
                        uploadDate = existingFileItem.created_at;
                        fileUrl = await mediaStorage.InsertFile(this.currentFile, storageName);
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
                        this.setModal.createModal('Please select a file to upload!');
                        this.setModal.showMessage();
                        return;
                    }
                    
                    uploadDate = new Date();
                    fileUrl = await mediaStorage.InsertFile(this.currentFile, storageName);
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
                    await tableStorages.changeSelectedData(this.selectedFileId, newFile);
                } else {
                    await tableStorages.addToStorage(newFile);
                }
            } catch (error) {
                this.setModal.createModal('Error uploading file');
                this.setModal.showMessage();
                this.closeForm();
            } finally {
                this.closeForm();
            }
        },

        createComponent(detail: FileItem): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'border-[#B71C1C] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';
            card.dataset.id = detail.id.toString();

            const file_name = document.createElement('h3');
            file_name.className = 'file-name';
            file_name.textContent = `File: ${detail.file_name}`;

            const uploader_name = document.createElement('p');
            uploader_name.className = 'uploader-name';
            uploader_name.textContent = `Uploaded by: ${detail.uploader_name}`;

            const uploadTime = document.createElement('p');
            uploadTime.className = 'date-time';
            uploadTime.textContent = `Uploaded at: ${detail.created_at.toLocaleString()}`;

            const selectButton = document.createElement('button');
            selectButton.className = 'bg-[#FF8C00] p-[0.4rem] text-[0.9rem] text-[#1A1A1A] cursor-pointer w-[88px] rounded-[0.4rem]';
            selectButton.textContent = 'Select';
            selectButton.onclick = () => {
                this.openForm();
                this.selectedFileId = detail.id;
                const fileData = tableStorages.currentData.get(detail.id);
                
                if (!fileData) return;
                
                username.value = fileData.uploader_name;
                this.showPreview(fileData);
                submitButton.textContent = 'Save Changes';
            }

            const deleteButton = document.createElement('button');
            deleteButton.className = 'bg-[#B71C1C] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = async () => {
                try {
                    if (tableStorages.currentData.size > 0) {
                        await tableStorages.deleteData(detail.id);
                        await mediaStorage.RemoveFile(detail.file_url, storageName)
                    } else {    
                        this.setModal.createModal('Please add one file');
                        this.setModal.showMessage();
                    }
                } catch (error) {
                    this.setModal.createModal('Error deleting file');
                    this.setModal.showMessage();
                }
            }
            
            const documentMeta = document.createElement('div');
            documentMeta.className = 'flex flex-col gap-[0.5rem]';
            documentMeta.append(file_name, uploader_name, uploadTime);

            const documentAction = document.createElement('div');
            documentAction.className = 'flex flex-wrap gap-[0.7rem]';
            documentAction.append(selectButton, deleteButton);
            
            card.append(this.fileIcon(detail), documentMeta, documentAction); 
            return card;
        },
        
        openDocument(selectedData: FileItem): void {
            window.open(selectedData.file_url, '_blank');
        },

        searchedData(event: Event): void {
            event.preventDefault();
            const trimmedValue = searchInput.value.trim().toLowerCase();

            temp = tableStorages.toArray().filter(data => data.file_name.includes(trimmedValue));
            this.showAllFiles(temp);
        },

        fileIcon(file: FileItem): HTMLElement {
            const icon = document.createElement('i') as HTMLElement;
            if (file.file_name.includes('.pdf')) icon.className = 'fa-solid fa-file-pdf';
            else if (file.file_name.includes('.txt')) icon.className = 'fa-solid fa-file-lines';
            else if (file.file_name.includes('.doc')) icon.className = 'fa-solid fa-file-word';
            else if (file.file_name.includes('.docx')) icon.className = 'fa-solid fa-file-word';
            else if (file.file_name.includes('.jpg')) icon.className = 'fa-solid fa-image';
            else if (file.file_name.includes('.jpeg')) icon.className = 'fa-solid fa-image';
            else if (file.file_name.includes('.png')) icon.className = 'fa-solid fa-image';

            return icon;
        },

        showPreview(detail: FileItem): void {
            preview.innerHTML = detail.file_type.startsWith('image/') ? 
            `<img src="${detail.file_url}" class="w-[100%] h-[100%] object-cover" alt="${detail.file_name}"/>` : 
            `<div class='file-preview'>${detail.file_name}</div>`;
        },

        async deleteAllFiles(): Promise<void> {
            try {
                if (tableStorages.currentData.size > 0) {
                    await tableStorages.deleteData();
                    await Promise.all(tableStorages.toArray().map(data => mediaStorage.RemoveFile(data.file_url, storageName)));
                    documentsList.innerHTML = '';
                    documentsList.textContent = 'No file added...';
                    this.resetForm();
                } else {    
                    this.setModal.createModal('Please add one file');
                    this.setModal.showMessage();
                }
            } catch (error) {
                this.setModal.createModal(`Error deleting all files: ${error}`);
                this.setModal.showMessage();
            }
        },

        openForm(): void {
            fileUploaderForm.classList.remove('hidden');
            fileUploaderForm.classList.add('flex');
        },

        closeForm(): void {
            fileUploaderForm.classList.remove('flex');
            fileUploaderForm.classList.add('hidden');
            this.resetForm();
        },

        resetForm(): void {
            this.selectedFileId = null;
            this.currentFile = null;
            this.currentFileDataUrl = '';
            fileInput.value = '';
            username.value = '';
            preview.innerHTML = 'Click here to upload your file';
            submitButton.textContent = 'Add';
        },

        cleanUpListener(): void {
            this.controller.abort;
            this.setModal.teardown();
            this.resetForm();
            tableStorages.teardownStorage();
        }
    }
}

export default Displayer;