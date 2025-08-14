import type { FileData } from "./custom-types";
import { supabase } from "./supabase-config";
import Modal from "./modal";
import SupabaseStorage from "./supabase-storage";
import TableStorage from "./supabase-table";

const fileTable = 'files_list';
const urlParams = new URLSearchParams(window.location.search);
const folderId = urlParams.get('id');
const tableStorage = TableStorage<FileData>();

const mediaStorage = SupabaseStorage();
const changeFileNameForm = document.getElementById('change-selected-filename') as HTMLFormElement;
const newFileName = document.getElementById('new-file-name') as HTMLInputElement;
const folderFileList = document.getElementById('folder-file-list') as HTMLElement;
const fileViewer = document.getElementById('file-viewer') as HTMLElement;
const fileContent = document.getElementById('file-content') as HTMLElement;
const modal = document.getElementById('folder-notification') as HTMLElement;
const closeUpdateFormBtn = document.getElementById('close-update-form') as HTMLButtonElement;
const deleteAllFilesBtn = document.getElementById('delete-all-files') as HTMLButtonElement;
const setNotification = Modal(modal);

let currentUserId: string | null = null;
let selectedFileId: string | null = null;

function FolderContents() {
    async function initFolderContents() {
        changeFileNameForm.addEventListener('submit', async (event) => await changeSelectedFileName(event));
        closeUpdateFormBtn.addEventListener('click', closeUpdateFileNameForm);
        deleteAllFilesBtn.addEventListener('click', async () => await deleteAllFiles());

        await tableStorage.realtimeInit({ 
            tableName: fileTable,
            callback: (detail) => showAllFilesInFolder(detail),
            additionalQuery: (addQuery) => addQuery.eq('folder_id', folderId)
        });
    }

    function showAllFilesInFolder(filesData: FileData[]) {
        const fileDataFragment = document.createDocumentFragment();
            try {
                if (filesData.length > 0) {
                    filesData.forEach(data => fileDataFragment.appendChild(createComponent(data)));
                    folderFileList.innerHTML = '';
                    folderFileList.appendChild(fileDataFragment);
                } else {
                    throw "No files added";
                }
            } catch (error: any) {
                setNotification.createModal(`Failed to load data: ${error.message || error}`);
                setNotification.showMessage();
                folderFileList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">${error.message || error}...</div>`;
            }
    }

    function createComponent(folderContent: FileData) {
        const card = document.createElement('div');
        card.className = 'border-[#B71C1C] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';
        card.dataset.id = folderContent.id;

        const file_name = document.createElement('h3');
        file_name.className = 'file-name';
        file_name.textContent = `File: ${folderContent.file_name}`;

        const uploadTime = document.createElement('p');
        uploadTime.className = 'date-time';
        uploadTime.textContent = `Uploaded at: ${folderContent.created_at.toLocaleString()}`;

        const selectButton = document.createElement('button');
        selectButton.className = 'bg-[#FF8C00] p-[0.4rem] text-[0.9rem] text-[#1A1A1A] cursor-pointer w-[88px] rounded-[0.4rem]';
        selectButton.textContent = 'Select';
        selectButton.onclick = () => {
            openUpdateFileNameForm();
            selectedFileId = folderContent.id;
            newFileName.value = folderContent.file_name;
        }

        const openFileButton = document.createElement('button');
        openFileButton.className = 'bg-[#4CAF50] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
        openFileButton.textContent = 'Open';
        openFileButton.onclick = () => openFileViewer(folderContent);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'bg-[#B71C1C] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = async () => await deleteSelectedFile(folderContent.id);
        
        const documentMeta = document.createElement('div');
        documentMeta.className = 'flex flex-col gap-[0.5rem]';
        documentMeta.append(file_name, uploadTime);

        const documentAction = document.createElement('div');
        documentAction.className = 'flex flex-wrap gap-[0.7rem]';
        documentAction.append(selectButton, openFileButton, deleteButton);
        
        card.append(fileIcon(folderContent), documentMeta, documentAction);
        return card;
    }

    async function changeSelectedFileName(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        if(!selectedFileId) return;
    }

    async function deleteSelectedFile(id: string): Promise<void> {
        try {
            if (tableStorage.currentData.size > 0) {
                const { data: allFiles, error: allFilesError } = await supabase
                .from(fileTable)
                .select('file_url')
                .eq('id', id)

                if (allFilesError) throw allFilesError.message;

                const deletePromises = allFiles.map(file => mediaStorage.RemoveFile(file.file_url, 'file-example'));
                await Promise.all(deletePromises);

                await tableStorage.deleteData({
                    tableName: fileTable, 
                    column: 'id', 
                    values: id
                });
            } else {    
                setNotification.createModal('Please add one file');
                setNotification.showMessage();
            }
        } catch (error: any) {
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showMessage();
        }
    }

    async function deleteAllFiles(): Promise<void> {
        if (!currentUserId) return;
        try {
            if (tableStorage.currentData.size > 0) {
                const { data: allFiles, error: errorAllFiles } = await supabase
                .from(fileTable)
                .select('file_url')
                .eq('user_id', currentUserId);

                if (errorAllFiles) throw errorAllFiles.message;

                const deletePromises = allFiles.map(file => mediaStorage.RemoveFile(file.file_url, 'file-example'));
                await Promise.all(deletePromises);

                await tableStorage.deleteData({
                    tableName: fileTable,
                    column: 'user_id',
                    values: currentUserId
                });
            }
        } catch (error: any) {
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showMessage();
        }
    }

    function openFileViewer(fileData: FileData) {
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
            const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
            fileContent.innerHTML = `<iframe src="${viewerUrl}" class="w-full h-full" frameborder="0"></iframe>`;
        } else {
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

    function openUpdateFileNameForm(): void {
        changeFileNameForm.classList.remove('hidden');
        changeFileNameForm.classList.add('flex');
    }

    function closeUpdateFileNameForm(): void {
        changeFileNameForm.classList.remove('hidden');
        changeFileNameForm.classList.add('flex');
    }

    function fileIcon(file: FileData): HTMLElement {
        const icon = document.createElement('i') as HTMLElement;
        if (file.file_name.includes('.pdf')) icon.className = 'fa-solid fa-file-pdf';
        else if (file.file_name.includes('.txt')) icon.className = 'fa-solid fa-file-lines';
        else if (file.file_name.includes('.doc')) icon.className = 'fa-solid fa-file-word';
        else if (file.file_name.includes('.docx')) icon.className = 'fa-solid fa-file-word';
        else if (file.file_name.includes('.jpg')) icon.className = 'fa-solid fa-image';
        else if (file.file_name.includes('.jpeg')) icon.className = 'fa-solid fa-image';
        else if (file.file_name.includes('.png')) icon.className = 'fa-solid fa-image';
        else icon.className = 'fa-solid fa-file';

        return icon;
    }

    function teardownFolderContents(): void {
        selectedFileId = null;
        changeFileNameForm.reset();
        changeFileNameForm.removeEventListener('submit', async (event) => await changeSelectedFileName(event));
        closeUpdateFormBtn.removeEventListener('click', closeUpdateFileNameForm);
        deleteAllFilesBtn.removeEventListener('click', async () => await deleteAllFiles());
    }

    return { initFolderContents, teardownFolderContents }
}

const folderContents = FolderContents();
const init = () => folderContents.initFolderContents();
const teardown = () => folderContents.teardownFolderContents();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);