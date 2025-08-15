import TableStorage from './supabase-table';
import Modal from './modal';
import SupabaseStorage from './supabase-storage';
import type { FileData } from './custom-types';
import { getSession, supabase } from './supabase-config';

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

const tableStorages = TableStorage<FileData>();
const mediaStorage = SupabaseStorage();
const storageName = 'file-example';
const fileTable = 'files_list';
let temp: FileData[];
let currentUserId: string | null = null;

function FilesPage () { 
    return {
        setModal: Modal(modal),
        controller: new AbortController() as  AbortController,
        selectedFileId: null as string | null,
        currentFile: null as File | null,
        currentFileDataUrl: '',
        selectedCategories: [
            'application/pdf', 'image/jpg', 'image/jpeg', 'image/png', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ] as string[],

        async filesPage(): Promise<void> {
            const session = await getSession();
            if (session && session.user) {
                currentUserId = session.user.id;
                if (currentUserId) await this.showUserName(currentUserId);
            } else {
                this.setModal.createModal('Please sign in to see your files');
                this.setModal.showMessage();
                return;
            }

            await tableStorages.realtimeInit({
                tableName: fileTable,
                callback: (filesData) => {
                    this.showAllFiles(filesData);
                    temp = filesData;
                },
                additionalQuery: (query) => query.eq('user_id', currentUserId)
            });
            
            fileInput.onchange = (event) => this.changeFileToUrl(event);
            fileUploaderForm.onsubmit = async (event) => await this.handleSubmit(event);
            searchedData.oninput = (event) => this.searchedData(event);
            
            document.addEventListener('click', async (event) => {
                const target = event.target as HTMLElement;
                if (target.closest('#delete-all-files')) await this.deleteAllFiles();
                else if (target.closest('#show-form')) this.openForm();
                else if (target.closest('#close-insert-form')) this.closeForm();
                else if (target.closest('#preview')) fileInput.click();
                else if (target.closest('#navbar-key')) this.showNavbar();
                else if (target.closest('#close-navbar-key')) this.hideNavbar();
                else if (target.closest('#close-file-viewer')) this.closeFileViewer();
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
                    .map(get_value => get_value.value as FileData['file_type']);
                    this.showAllFiles(temp);
                }
            });
        },

        showNavbar() {
            navbar.classList.add('flex');
            navbar.classList.remove('hidden');
        },

        hideNavbar() {
            navbar.classList.remove('flex');
            navbar.classList.add('hidden');
        },

        async showUserName(id: string) {
            try {
                const { data, error } = await supabase
                .from('cart_user')
                .select('username')
                .eq('id', id)
                .single()

                if (error) throw 'Failed to get and show username';

                if (data && data.username) {
                    username.innerHTML = '';
                    username.textContent = `Hello, ${data.username}`;
                } else {
                    username.innerHTML = '';
                    username.textContent = 'Hello, user';
                }
            } catch (error: any) {
                username.innerHTML = '';
                username.textContent = `User`;
                this.setModal.createModal(`Error: ${error.message || error}`);
                this.setModal.showMessage();
            }
        },

        showAllFiles(filesData: FileData[]): void {
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

                        fileUrl = await mediaStorage.InsertFile(this.currentFile, storageName);
                        newFileName = this.currentFile.name;
                        newFileType = this.currentFile.type;
                    } else {
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
                    
                    fileUrl = await mediaStorage.InsertFile(this.currentFile, storageName);
                    newFileName = this.currentFile.name;
                    newFileType = this.currentFile.type;
                }

                if (this.selectedFileId) {
                    await tableStorages.changeSelectedData({ 
                        tableName: fileTable, 
                        value: this.selectedFileId, 
                        column: 'id',
                        newData: {
                            file_name: newFileName,
                            file_type: newFileType,
                            file_url: fileUrl
                        }
                    });
                } else {
                    if (!currentUserId) return;

                    await tableStorages.addToStorage({
                        tableName: fileTable, 
                        data: {                            
                            file_name: newFileName,
                            file_type: newFileType,
                            file_url: fileUrl,
                            user_id: currentUserId
                        }
                    });
                }
            } catch (error) {
                this.setModal.createModal('Error uploading file');
                this.setModal.showMessage();
                this.closeForm();
            } finally {
                this.closeForm();
            }
        },

        createComponent(detail: FileData): HTMLDivElement {
            const card = document.createElement('div');
            card.className = 'border-[#B71C1C] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';
            card.dataset.id = detail.id;

            const file_name = document.createElement('h3');
            file_name.className = 'file-name';
            file_name.textContent = `File: ${detail.file_name}`;

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
                
                this.showPreview(fileData);
                submitButton.textContent = 'Save Changes';
            }

            const openFileButton = document.createElement('button');
            openFileButton.className = 'bg-[#4CAF50] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
            openFileButton.textContent = 'Open';
            openFileButton.onclick = () => this.openFileViewer(detail);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'bg-[#B71C1C] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = async () => {
                try {
                    if (tableStorages.currentData.size > 0) {
                        const { data: allFiles, error: allFilesError } = await supabase
                        .from(fileTable)
                        .select('file_url')
                        .eq('id', detail.id)

                        if (allFilesError) throw allFilesError.message;

                        const deletePromises = allFiles.map(file => mediaStorage.RemoveFile(file.file_url, 'file-example'));
                        await Promise.all(deletePromises);

                        await tableStorages.deleteData({
                            tableName: fileTable, 
                            column: 'id', 
                            values: detail.id
                        });
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
            documentMeta.append(file_name, uploadTime);

            const documentAction = document.createElement('div');
            documentAction.className = 'flex flex-wrap gap-[0.7rem]';
            documentAction.append(selectButton, openFileButton, deleteButton);
            
            card.append(this.fileIcon(detail), documentMeta, documentAction);
            return card;
        },

        searchedData(event: Event): void {
            event.preventDefault();
            const trimmedValue = searchedData.value.trim().toLowerCase();

            temp = tableStorages.toArray().filter(data => data.file_name.includes(trimmedValue));
            this.showAllFiles(temp);
        },

        fileIcon(file: FileData): HTMLElement {
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

        showPreview(detail: FileData): void {
            preview.innerHTML = detail.file_type.startsWith('image/') ? 
            `<img src="${detail.file_url}" class="w-[100%] h-[100%] object-cover" alt="${detail.file_name}"/>` : 
            `<div class='file-preview'>${detail.file_name}</div>`;
        },

        async deleteAllFiles(): Promise<void> {
            try {
                if (!currentUserId) return;

                if (tableStorages.currentData.size > 0) {
                    const { data: allFiles, error: allFilesError } = await supabase
                    .from(fileTable)
                    .select('file_url')
                    .eq('user_id', currentUserId);

                    if (allFilesError) throw allFilesError.message;

                    const deletePromises = allFiles.map(file => mediaStorage.RemoveFile(file.file_url, 'file-example'));
                    await Promise.all(deletePromises);

                    await tableStorages.deleteData({
                        tableName: fileTable,
                        column: 'user_id',
                        values: currentUserId
                    });
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
            fileUploaderForm.reset();
            preview.innerHTML = 'Click here to upload your file';
            submitButton.textContent = 'Add';
        },

        openFileViewer(fileData: FileData): void {
            fileContent.innerHTML = ''; 
            fileViewer.classList.remove('hidden');
            fileViewer.classList.add('flex');

            const fileType = fileData.file_type;
            const fileUrl = fileData.file_url;
            const isOfficeFile = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
            ].includes(fileType);

            if (fileType.startsWith('image/')) {
                fileContent.innerHTML = `<img src="${fileUrl}" class="w-full h-full object-contain" alt="${fileData.file_name}"/>`;
            } else if (isOfficeFile || fileType === 'application/pdf') {
                // Menggunakan Google Docs Viewer untuk menampilkan file Office dan PDF
                const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
                fileContent.innerHTML = `<iframe src="${viewerUrl}" class="w-full h-full" frameborder="0"></iframe>`;
            } else {
                // Menangani file non-gambar, non-pdf, dan non-office, seperti teks
                fetch(fileUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok.');
                    }
                    return response.text();
                })
                .then(text => {
                    fileContent.innerHTML = `<pre class="whitespace-pre-wrap">${text}</pre>`;
                })
                .catch(error => {
                    fileContent.textContent = `Failed to load file content. Error: ${error.message}`;
                });
            }
        },

        closeFileViewer(): void {
            fileViewer.classList.remove('flex');
            fileViewer.classList.add('hidden');
            fileContent.innerHTML = '';
        },

        teardownFilesPage(): void {
            this.controller.abort;
            this.setModal.teardown();
            this.resetForm();
            this.hideNavbar();
            this.closeFileViewer();
            tableStorages.teardownStorage();
            currentUserId = null;
        }
    }
}

const filesPage = FilesPage();
const init = () => filesPage.filesPage();
const teardown = () => filesPage.teardownFilesPage();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);