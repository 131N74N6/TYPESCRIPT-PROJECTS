import TableStorage from './supabase-table';
import Modal from './modal';
import SupabaseStorage from './supabase-storage';
import type { FileData } from './custom-types';
import { getSession, supabase } from './supabase-config';

const fileUploaderForm = document.getElementById('upload-file-section') as HTMLFormElement;
const username = document.getElementById('username') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const preview = document.getElementById('preview') as HTMLDivElement;

const navbar = document.getElementById('side-navbar') as HTMLElement;
const searchedFile = document.getElementById('searched-data') as HTMLInputElement;
const sortingData = document.getElementById('sorting-data') as HTMLSelectElement;
const documentsList = document.getElementById('documents-list') as HTMLElement;
const modal = document.getElementById('file-notification') as HTMLElement;
const setModal = Modal(modal);
const fileViewer = document.getElementById('file-viewer') as HTMLElement;
const fileContent = document.getElementById('file-content') as HTMLElement;

const changeFileNameForm = document.querySelector('#change-selected-filename') as HTMLFormElement;
const newFileName = document.querySelector('#new-file-name') as HTMLInputElement;
const folderMover = document.querySelector('#move-to-folder') as HTMLSelectElement;

const tableStorages = TableStorage<FileData>();
const mediaStorage = SupabaseStorage();
const bucketName = 'file-example';
const cloudUserTable = 'cloud_user';
const folderTable = 'folder_list';
const fileTable = 'files_list';
let temp: FileData[];
let currentUserId: string | null = null;
const controller = new AbortController();

let selectedFileId = null as string | null;
let currentFile = null as File | null;
let currentFileDataUrl = '';

function FilesPage () { 
    async function initFilesPage(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            currentUserId = session.user.id;
            if (currentUserId) await showUserName(currentUserId);
        } else {
            setModal.createModal('Please sign in to see your files');
            setModal.showMessage();
            window.location.replace('/html/signin.html');
            return;
        }

        await tableStorages.realtimeInit({
            tableName: fileTable,
            callback: (filesData) => {
                showAllFiles(filesData);
                temp = filesData;
            },
            additionalQuery: (query) => query.eq('user_id', currentUserId)
        });

        folderOptionComponent();
        
        fileInput.onchange = (event) => changeFileToUrl(event);
        fileUploaderForm.onsubmit = async (event) => await handleSubmit(event);
        changeFileNameForm.onsubmit = async (event) => await changeSelectedFileName(event);
        searchedFile.oninput = (event) => searchedData(event);
        
        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#delete-all-files')) await deleteAllFiles();
            else if (target.closest('#show-form')) openInsertForm();
            else if (target.closest('#close-insert-form')) closeInsertForm();
            else if (target.closest('#close-update-form')) closeChangeFilenameForm();
            else if (target.closest('#preview')) fileInput.click();
            else if (target.closest('#navbar-key')) showNavbar();
            else if (target.closest('#close-navbar-key')) hideNavbar();
            else if (target.closest('#close-file-viewer')) closeFileViewer();
        }, { signal: controller.signal });

        sortingData.onchange = (event) => {
            const getValue = event.target as HTMLInputElement;
            switch (getValue.value) {
                case 'from-A-Z': {
                    temp = [...temp].sort((a, b) => a.file_name.localeCompare(b.file_name));
                    showAllFiles(temp);
                    break;
                }
                case 'from-Z-A': {
                    temp = [...temp].sort((a, b) => b.file_name.localeCompare(a.file_name));
                    showAllFiles(temp);
                    break;
                }
                case 'from-newest': {
                    temp = [...temp].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
                    showAllFiles(temp);
                    break;
                }
                case 'from-oldest': {
                    temp = [...temp].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
                    showAllFiles(temp);
                    break;
                }
                default: {
                    showAllFiles(tableStorages.toArray());
                    break;
                }
            }
        }
    }

    async function folderOptionComponent(): Promise<void> {
        const { data, error } = await supabase
        .from(folderTable)
        .select('id, folder_name')
        .eq('user_id', currentUserId);

        if (error) throw error.message;

        data.forEach(dt => {
            const folderOpt = document.createElement('option') as HTMLOptionElement;
            folderOpt.value = dt.id;
            folderOpt.textContent = dt.folder_name;
            folderOpt.className = 'text-[#FFFFFF] bg-[#1A1A1A]';
            folderMover.append(folderOpt);
        });
    }

    function showNavbar(): void {
        navbar.classList.add('flex');
        navbar.classList.remove('hidden');
    }

    function hideNavbar() {
        navbar.classList.remove('flex');
        navbar.classList.add('hidden');
    }

    async function showUserName(userId: string): Promise<void> {
        try {
            const { data, error } = await supabase
            .from(cloudUserTable)
            .select('username')
            .eq('id', userId)
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
            setModal.createModal(`Error: ${error.message || error}`);
            setModal.showMessage();
        }
    }

    function showAllFiles(filesData: FileData[]): void {
        const fileDataFragment = document.createDocumentFragment();
        try {
            if (filesData.length > 0) {
                filesData.forEach(fileData => fileDataFragment.appendChild(createComponent(fileData)));
                documentsList.innerHTML = '';
                documentsList.appendChild(fileDataFragment);
            } else {
                documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">No files added...</div>`;
            }
        } catch (error: any) {
            documentsList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">Error ${error.message || error}...</div>`;
        }
    }

    function changeFileToUrl(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] || null; 
        currentFile = file;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = (event) => {
                currentFileDataUrl = event.target?.result as string;
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `<img src="${currentFileDataUrl}" class="w-[100%] h-[100%] object-cover" alt="Preview"/>`;
                } else {
                    preview.textContent = file.name;
                }
            }
            reader.readAsDataURL(file);
        }
    }

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        if (!currentUserId) return;

        try {
            let fileUrl: string = '';

            if (!currentFile) {
                setModal.createModal('Please select a file to upload!');
                setModal.showMessage();
                return;
            }
            
            fileUrl = await mediaStorage.InsertFile(currentFile, bucketName);

            await tableStorages.addToStorage({
                tableName: fileTable, 
                data: {                            
                    file_name: currentFile.name,
                    file_type: currentFile.type,
                    file_url: fileUrl,
                    user_id: currentUserId
                }
            });
        } catch (error) {
            setModal.createModal('Error uploading file');
            setModal.showMessage();
        } finally {
            closeInsertForm();
            fileInput.value = '';
        }
    }

    function createComponent(detail: FileData): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'border-[#B71C1C] bg-[#2D2D2D] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';
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
            openChangeFilenameForm();
            selectedFileId = detail.id;
            newFileName.value = detail.file_name;
        }

        const openFileButton = document.createElement('button');
        openFileButton.className = 'bg-[#4CAF50] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
        openFileButton.textContent = 'Open';
        openFileButton.onclick = () => openFileViewer(detail);

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
                    setModal.createModal('Please add one file');
                    setModal.showMessage();
                }
            } catch (error) {
                setModal.createModal('Error deleting file');
                setModal.showMessage();
            }
        }
        
        const documentMeta = document.createElement('div');
        documentMeta.className = 'flex flex-col gap-[0.5rem]';
        documentMeta.append(file_name, uploadTime);

        const documentAction = document.createElement('div');
        documentAction.className = 'flex flex-wrap gap-[0.7rem]';
        documentAction.append(selectButton, openFileButton, deleteButton);
        
        card.append(fileIcon(detail), documentMeta, documentAction);
        return card;
    }

    function searchedData(event: Event): void {
        event.preventDefault();
        const trimmedValue = searchedFile.value.trim().toLowerCase();

        temp = tableStorages.toArray().filter(data => data.file_name.includes(trimmedValue));
        showAllFiles(temp);
    }

    function fileIcon(fileData: FileData): HTMLElement {
        const icon = document.createElement('i') as HTMLElement;
        if (fileData.file_name.includes('.pdf')) icon.className = 'fa-solid fa-file-pdf';
        else if (fileData.file_type.startsWith('image/')) icon.className = 'fa-solid fa-image';
        else if (fileData.file_type.startsWith('text/')) icon.className = 'fa-solid fa-file-lines';
        else if (fileData.file_name.includes('.docx')) icon.className = 'fa-solid fa-file-word';
        else if (fileData.file_name.includes('.pptx')) icon.className = 'fa-solid fa-file-powerpoint';
        else if (fileData.file_name.includes('.xlsx')) icon.className = 'fa-solid fa-file-excel';
        else icon.className = 'fa-solid fa-file';

        return icon;
    }

    async function changeSelectedFileName(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        try {
            const trimmedNewFileName = newFileName.value.trim();

            if (trimmedNewFileName === '') throw 'Missing required data';

            if (!selectedFileId) return;

            const { data, error } = await supabase
            .from(fileTable)
            .select('file_url')
            .eq('id', selectedFileId)
            .single();

            if (error) throw error.message;

            if (!data?.file_url) throw 'url file not found';

            const getNewUrl = await mediaStorage.RenameFile({
                oldFilePath: data.file_url, 
                newFileName: trimmedNewFileName, 
                bucketName: bucketName
            });

            const getFolderId = folderMover.value;

            await tableStorages.changeSelectedData({
                tableName: fileTable,
                column: 'id',
                value: selectedFileId,
                newData: {
                    file_name: trimmedNewFileName,
                    file_url: getNewUrl,
                    folder_id: getFolderId
                }
            });
        } catch (error: any) {
            setModal.createModal(error.message || error);
            setModal.showMessage();
        } finally {
            selectedFileId = null;
            changeFileNameForm.reset();
            closeChangeFilenameForm();
        }
    }

    async function deleteAllFiles(): Promise<void> {
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
                await Promise.all(tableStorages.toArray().map(data => mediaStorage.RemoveFile(data.file_url, bucketName)));
                documentsList.innerHTML = '';
                documentsList.textContent = 'No file added...';
                resetForm();
            } else {    
                setModal.createModal('Please add one file');
                setModal.showMessage();
            }
        } catch (error) {
            setModal.createModal(`Error deleting all files: ${error}`);
            setModal.showMessage();
        }
    }

    function openInsertForm(): void {
        fileUploaderForm.classList.remove('hidden');
        fileUploaderForm.classList.add('flex');
    }

    function closeInsertForm(): void {
        fileUploaderForm.classList.remove('flex');
        fileUploaderForm.classList.add('hidden');
        fileInput.value = '';
    }

    function openChangeFilenameForm(): void {
        changeFileNameForm.classList.remove('hidden');
        changeFileNameForm.classList.add('flex');
    }

    function closeChangeFilenameForm(): void {
        changeFileNameForm.classList.remove('flex');
        changeFileNameForm.classList.add('hidden');
        resetForm();
    }

    function resetForm(): void {
        selectedFileId = null;
        changeFileNameForm.reset();
        currentFile = null;
        currentFileDataUrl = '';
        fileInput.value = '';
        fileUploaderForm.reset();
        preview.innerHTML = 'Click here to upload your file';
    }

    function openFileViewer(fileData: FileData): void {
        fileContent.innerHTML = ''; 
        fileViewer.classList.remove('hidden');
        fileViewer.classList.add('flex');

        const fileType = fileData.file_type;
        const fileUrl = fileData.file_url;
        const isOfficeFile = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ].includes(fileType);

        if (fileType.startsWith('image/')) {
            fileContent.innerHTML = `<img src="${fileUrl}" class="w-full h-full object-contain" alt="${fileData.file_name}"/>`;
        } else if (isOfficeFile || fileType === 'application/pdf') {
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
    }

    function closeFileViewer(): void {
        fileViewer.classList.remove('flex');
        fileViewer.classList.add('hidden');
        fileContent.innerHTML = '';
    }

    function teardownFilesPage(): void {
        temp = [];
        currentFile = null;
        selectedFileId = null;
        currentUserId = null;
        controller.abort;
        setModal.teardown();
        resetForm();
        hideNavbar();
        closeFileViewer();
        tableStorages.teardownStorage();
    }

    return { initFilesPage, teardownFilesPage }
}

const filesPage = FilesPage();
const init = () => filesPage.initFilesPage();
const teardown = () => filesPage.teardownFilesPage();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);