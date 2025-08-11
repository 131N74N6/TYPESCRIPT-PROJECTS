import DataStorages from './supabase-table';
import Modal from './modal';
import SupabaseStorage from './supabase-storage';
import type { CloudStorageProps, FileData } from './custom-types';
import { getSession, supabase } from './supabase-config';

const tableStorages = DataStorages<FileData>('files_list');
const mediaStorage = SupabaseStorage();
const storageName = 'file-example';
let temp: FileData[];
let currentUserId: string | null = null;

function CloudStorage (props: CloudStorageProps) { 
    return {
        setModal: Modal(props.modal),
        controller: new AbortController() as  AbortController,
        selectedFileId: null as string | null,
        currentFile: null as File | null,
        currentFileDataUrl: '',
        selectedCategories: [
            'application/pdf', 'image/jpg', 'image/jpeg', 'image/png', 'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ] as string[],

        async initCloudStorage(): Promise<void> {
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
                callback: (filesData) => {
                    this.showAllFiles(filesData);
                    temp = filesData;
                },
                additionalQuery: (query) => query.eq('user_id', currentUserId)
            });
            
            props.fileInput.onchange = (event) => this.changeFileToUrl(event);
            props.fileUploaderForm.onsubmit = async (event) => await this.handleSubmit(event);
            props.searchInput.oninput = (event) => this.searchedData(event);
            
            document.addEventListener('click', async (event) => {
                const target = event.target as HTMLElement;
                if (target.closest('#delete-all-files')) await this.deleteAllFiles();
                else if (target.closest('#show-form')) this.openForm();
                else if (target.closest('#close-insert-form')) this.closeForm();
                else if (target.closest('#preview')) props.fileInput.click();
                else if (target.closest('#navbar-key')) this.showNavbar();
                else if (target.closest('#close-navbar-key')) this.hideNavbar();
                else if (target.closest('#close-file-viewer')) this.closeFileViewer();
            }, { signal: this.controller.signal });

            props.sortingData.onchange = (event) => {
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

            props.checkboxCategory.forEach(checkbox => {
                checkbox.onchange = () => {
                    this.selectedCategories = Array.from(props.checkboxCategory)
                    .filter(selected => selected.checked)
                    .map(get_value => get_value.value as FileData['file_type']);
                    this.showAllFiles(temp);
                }
            });
        },

        showNavbar() {
            props.navbar.classList.add('flex');
            props.navbar.classList.remove('hidden');
        },

        hideNavbar() {
            props.navbar.classList.remove('flex');
            props.navbar.classList.add('hidden');
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
                    props.username.innerHTML = '';
                    props.username.textContent = `Hello, ${data.username}`;
                } else {
                    props.username.innerHTML = '';
                    props.username.textContent = 'Hello, user';
                }
            } catch (error: any) {
                props.username.innerHTML = '';
                props.username.textContent = `User`;
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
                    props.documentsList.innerHTML = '';
                    props.documentsList.appendChild(fileDataFragment);
                } else {
                    props.documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">No files added...</div>`;
                }
            } catch (error: any) {
                this.setModal.createModal(`Failed to load data: ${error.message || error}`);
                this.setModal.showMessage();
                props.documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">Error ${error.message || error}...</div>`;
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
                        props.preview.innerHTML = `<img src="${this.currentFileDataUrl}" class="w-[100%] h-[100%] object-cover" alt="Preview"/>`;
                    } else {
                        props.preview.textContent = file.name;
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
                    await tableStorages.changeSelectedData(this.selectedFileId, {
                        file_name: newFileName,
                        file_type: newFileType,
                        file_url: fileUrl
                    });
                } else {
                    if (!currentUserId) return;

                    await tableStorages.addToStorage({
                        file_name: newFileName,
                        file_type: newFileType,
                        file_url: fileUrl,
                        user_id: currentUserId
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
            card.dataset.id = detail.id.toString();

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
                props.submitButton.textContent = 'Save Changes';
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
            documentMeta.append(file_name, uploadTime);

            const documentAction = document.createElement('div');
            documentAction.className = 'flex flex-wrap gap-[0.7rem]';
            documentAction.append(selectButton, openFileButton, deleteButton);
            
            card.append(this.fileIcon(detail), documentMeta, documentAction);
            return card;
        },

        searchedData(event: Event): void {
            event.preventDefault();
            const trimmedValue = props.searchInput.value.trim().toLowerCase();

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
            props.preview.innerHTML = detail.file_type.startsWith('image/') ? 
            `<img src="${detail.file_url}" class="w-[100%] h-[100%] object-cover" alt="${detail.file_name}"/>` : 
            `<div class='file-props.preview'>${detail.file_name}</div>`;
        },

        async deleteAllFiles(): Promise<void> {
            try {
                if (tableStorages.currentData.size > 0) {
                    await tableStorages.deleteData();
                    await Promise.all(tableStorages.toArray().map(data => mediaStorage.RemoveFile(data.file_url, storageName)));
                    props.documentsList.innerHTML = '';
                    props.documentsList.textContent = 'No file added...';
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
            props.fileUploaderForm.classList.remove('hidden');
            props.fileUploaderForm.classList.add('flex');
        },

        closeForm(): void {
            props.fileUploaderForm.classList.remove('flex');
            props.fileUploaderForm.classList.add('hidden');
            this.resetForm();
        },

        resetForm(): void {
            this.selectedFileId = null;
            this.currentFile = null;
            this.currentFileDataUrl = '';
            props.fileInput.value = '';
            props.fileUploaderForm.reset();
            props.preview.innerHTML = 'Click here to upload your file';
            props.submitButton.textContent = 'Add';
        },

        openFileViewer(fileData: FileData): void {
            props.fileContent.innerHTML = ''; 
            props.fileViewer.classList.remove('hidden');
            props.fileViewer.classList.add('flex');

            const fileType = fileData.file_type;
            const fileUrl = fileData.file_url;
            const isOfficeFile = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
            ].includes(fileType);

            if (fileType.startsWith('image/')) {
                props.fileContent.innerHTML = `<img src="${fileUrl}" class="w-full h-full object-contain" alt="${fileData.file_name}"/>`;
            } else if (isOfficeFile || fileType === 'application/pdf') {
                // Menggunakan Google Docs Viewer untuk menampilkan file Office dan PDF
                const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
                props.fileContent.innerHTML = `<iframe src="${viewerUrl}" class="w-full h-full" frameborder="0"></iframe>`;
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
                    props.fileContent.innerHTML = `<pre class="whitespace-pre-wrap">${text}</pre>`;
                })
                .catch(error => {
                    props.fileContent.textContent = `Failed to load file content. Error: ${error.message}`;
                });
            }
        },

        closeFileViewer(): void {
            props.fileViewer.classList.remove('flex');
            props.fileViewer.classList.add('hidden');
            props.fileContent.innerHTML = '';
        },

        cleanUpListener(): void {
            this.controller.abort;
            this.setModal.teardown();
            this.resetForm();
            this.hideNavbar();
            this.closeFileViewer();
            tableStorages.teardownStorage();
        }
    }
}

export default CloudStorage;