import type { FolderData } from "./custom-types";
import Modal from "./modal";
import { getSession, supabase } from "./supabase-config";
import TableStorage from "./supabase-table";
import SupabaseStorage from './supabase-storage';

const cloudUserTable = 'cloud_user';
const folderTable = 'folder_list';
const fileTable = 'files_list';
const tableStorages = TableStorage<FolderData>();
const supabaseStorage = SupabaseStorage();

const username = document.getElementById('username') as HTMLElement;
const insertFolderForm = document.getElementById('make-folder-section') as HTMLFormElement;
const folderName = document.getElementById('folder-name') as HTMLInputElement;
const modal = document.getElementById('folder-notification') as HTMLElement;
const changeFolderForm = document.getElementById('change-folder-section') as HTMLFormElement;
const newFolderName = document.querySelector('#new-folder-name') as HTMLInputElement;
const folderList = document.querySelector('#folder-list') as HTMLElement;
const sideNavBar = document.querySelector('#side-navbar') as HTMLElement

const notificationSetter = Modal(modal);
const sideNavBarBtn = document.querySelector('#navbar-key') as HTMLButtonElement;
const closeSideNavBarBtn = document.querySelector('#close-navbar-key') as HTMLButtonElement;
const showInsertFolderBtn = document.getElementById('show-insert-folder-form') as HTMLButtonElement;
const closeInsertFolderBtn = document.getElementById('close-folder-form') as HTMLButtonElement;
const closeChangeFolderBtn = document.getElementById('close-change-folder-form') as HTMLButtonElement;
const deleteAllFoldersBtn = document.getElementById('delete-all-folders') as HTMLButtonElement;

let currentUserId: string | null = null;
let selectedFolderId: string | null = null;

function FoldersPage() {
    async function initFoldersPage(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            currentUserId = session.user.id;
            if (currentUserId) await showUserName(currentUserId);
        } else {
            notificationSetter.createModal('Please sign in to add folder');
            notificationSetter.showMessage();
            window.location.replace('/html/signin.html');
            return;
        }
        
        insertFolderForm.addEventListener('submit', async (event) => await insertNewFolder(event));
        changeFolderForm.addEventListener('submit', async (event) => await changeFolderName(event));
        
        sideNavBarBtn.addEventListener('click', openSideNavBar);
        closeSideNavBarBtn.addEventListener('click', closeSideNavBar);

        showInsertFolderBtn.addEventListener('click', openInsertFolderForm);
        closeInsertFolderBtn.addEventListener('click', closeInsertFolderForm);
        closeChangeFolderBtn.addEventListener('click', closeChangeFolderForm);
        deleteAllFoldersBtn.addEventListener('click', async () => await deleteAllFolders());

        await tableStorages.realtimeInit({
            tableName: folderTable,
            callback: (folders) => showAllFolders(folders),
            additionalQuery: (addQuery) => addQuery.eq('user_id', currentUserId)
        });
    }

    async function showUserName(userId: string) {
        try {    
            const { data, error } = await supabase
            .from(cloudUserTable)
            .select('username')
            .eq('id', userId)
            .single();

            if (error) throw 'Failed to get and show username';

            if (data && data.username) {
                username.innerHTML = '';
                username.textContent = `Hello, ${data.username}`;
            } else {
                username.innerHTML = '';
                username.textContent = 'Hello, User';
            }
        } catch (error: any) {
            notificationSetter.createModal(`Error: ${error.message || error}`);
            notificationSetter.showMessage();
        }
    }

    function openSideNavBar(): void {
        sideNavBar.classList.remove('hidden');
        sideNavBar.classList.add('flex');
    }

    function closeSideNavBar(): void {
        sideNavBar.classList.remove('flex');
        sideNavBar.classList.add('hidden');
    }

    function openInsertFolderForm(): void {
        insertFolderForm.classList.remove('hidden');
        insertFolderForm.classList.add('flex');
    }

    function closeInsertFolderForm(): void {
        insertFolderForm.classList.remove('flex');
        insertFolderForm.classList.add('hidden');
        insertFolderForm.reset();
    }

    function openChangeFolderForm(): void {
        changeFolderForm.classList.remove('hidden');
        changeFolderForm.classList.add('flex');
    }

    function closeChangeFolderForm(): void {
        changeFolderForm.classList.remove('flex');
        changeFolderForm.classList.add('hidden');
        changeFolderForm.reset();
    }

    async function insertNewFolder(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedFolderName = folderName.value.trim();

        if (!currentUserId) return;

        if (trimmedFolderName === '') throw 'Missing required data';

        try {
            await tableStorages.addToStorage({
                tableName: folderTable,
                data: {
                    folder_name: trimmedFolderName,
                    user_id: currentUserId
                }
            });
        } catch (error: any) {
            notificationSetter.createModal(`Error: ${error.message || error}`);
            notificationSetter.showMessage();
        } finally {
            insertFolderForm.reset();
            closeInsertFolderForm();
        }
    }

    function showAllFolders(foldersData: FolderData[]): void {
        const fileDataFragment = document.createDocumentFragment();
        try {
            if (foldersData.length > 0) {
                foldersData.forEach(data => fileDataFragment.appendChild(createComponent(data)));
                folderList.innerHTML = '';
                folderList.appendChild(fileDataFragment);
            } else {
                folderList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">No folders added...</div>`;
            }
        } catch (error: any) {
            folderList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">Error: ${error.message || error}...</div>`;
        }
    }

    function createComponent(detail: FolderData): HTMLDivElement {
        const card = document.createElement('div');
        card.className = 'border-[#B71C1C] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';

        const folderIcon = document.createElement('div') as HTMLDivElement;
        folderIcon.className = 'fa-solid fa-folder text-[#FFFFFF] font-[550] text-[0.9rem]'
        const folderName = document.createElement('h3');
        folderName.className = 'file-name';
        folderName.textContent = `${detail.folder_name}`;

        const uploadTime = document.createElement('p');
        uploadTime.className = 'date-time';
        uploadTime.textContent = `Uploaded at: ${detail.created_at.toLocaleString()}`;

        const selectButton = document.createElement('button');
        selectButton.className = 'bg-[#FF8C00] p-[0.4rem] text-[0.9rem] text-[#1A1A1A] cursor-pointer w-[88px] rounded-[0.4rem]';
        selectButton.textContent = 'Select';
        selectButton.onclick = () => {
            openChangeFolderForm();
            selectedFolderId = detail.id;
            newFolderName.value = detail.folder_name;
        }

        const deleteButton = document.createElement('button');
        deleteButton.className = 'bg-[#B71C1C] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = async () => await deleteSelectedFolder(detail.id);

        const openFolder = document.createElement('button');
        openFolder.className = 'bg-[#4CAF50] p-[0.4rem] text-[0.9rem] text-[#FFFFFF] cursor-pointer w-[80px] rounded-[0.4rem]';
        openFolder.textContent = 'Open';
        openFolder.onclick = () => window.location.href = `folder-detail.html?id=${detail.id}`;
        
        const documentMeta = document.createElement('div');
        documentMeta.className = 'flex flex-col gap-[0.5rem]';
        documentMeta.append(folderIcon, folderName, uploadTime);

        const folderAction = document.createElement('div');
        folderAction.className = 'flex flex-wrap gap-[0.7rem]';
        folderAction.append(selectButton, deleteButton, openFolder);
        
        card.append(documentMeta, folderAction);
        return card;
    }

    async function changeFolderName(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedNewFolderName = newFolderName.value.trim();

        if (!selectedFolderId) return;

        try {
            await tableStorages.changeSelectedData({
                value: selectedFolderId,
                column: 'id',
                tableName: folderTable,
                newData: { folder_name: trimmedNewFolderName }
            });
        } catch (error: any) {
            notificationSetter.createModal(`${error.message || error}`);
            notificationSetter.showMessage();
        } finally {
            selectedFolderId = null;
            changeFolderForm.reset();
            closeChangeFolderForm();
        }
    }

    async function deleteSelectedFolder(id: string): Promise<void> {
        try {
            const { data: allFiles, error: allFilesError } = await supabase
            .from(fileTable)
            .select('file_url')
            .eq('folder_id', id);

            if (allFilesError) throw allFilesError;

            const deletePromises = allFiles.map(file => supabaseStorage.RemoveFile(file.file_url, 'file-example'));
            await Promise.all(deletePromises);

            await tableStorages.deleteData({
                tableName: fileTable, 
                column: 'folder_id', 
                values: id
            });
            
            await tableStorages.deleteData({
                tableName: folderTable, 
                column: 'id',
                values: id
            });
        } catch (error: any) {
            notificationSetter.createModal(`${error.message || error}`);
            notificationSetter.showMessage();
        }
    }

    async function deleteAllFolders(): Promise<void> {
        try {
            if (!currentUserId) return;

            if (tableStorages.currentData.size > 0) {
                const { data: allFolders, error: allFoldersError } = await supabase
                .from(folderTable)
                .select('id')
                .eq('user_id', currentUserId);

                if (allFoldersError) throw allFoldersError.message;

                if (allFolders.length === 0) throw 'No folders added.';

                const folderIds: string[] = allFolders.map(folder => folder.id);

                const { data: filesInFolders, error: filesError } = await supabase
                .from(fileTable)
                .select('file_url')
                .in('folder_id', folderIds);

                if (filesError) throw filesError.message;

                if (filesInFolders.length === 0) throw 'No folders found.';

                const deletePromises = filesInFolders.map(file => supabaseStorage.RemoveFile(file.file_url, 'file-example'));
                await Promise.all(deletePromises);

                await tableStorages.deleteData({
                    tableName: fileTable,
                    column: 'folder_id',
                    values: folderIds
                });
                
                await tableStorages.deleteData({
                    tableName: folderTable,
                    column: 'id',
                    values: folderIds
                });
            } else throw 'No folder added recently';
        } catch (error: any) {
            notificationSetter.createModal(`${error.message || error}`);
            notificationSetter.showMessage();
        }
    }

    function teradownFoldersPage(): void {
        notificationSetter.teardown();
        closeChangeFolderForm();
        closeInsertFolderForm();
        currentUserId = null;
        sideNavBarBtn.removeEventListener('click', openSideNavBar);
        closeSideNavBarBtn.removeEventListener('click', closeSideNavBar);
        insertFolderForm.removeEventListener('submit', async (event) => insertNewFolder(event));
        changeFolderForm.removeEventListener('submit', async (event) => await changeFolderName(event));
        showInsertFolderBtn.removeEventListener('click', openInsertFolderForm);
        closeInsertFolderBtn.removeEventListener('click', closeInsertFolderForm);
        closeChangeFolderBtn.removeEventListener('click', closeChangeFolderForm);
        deleteAllFoldersBtn.removeEventListener('click', async () => await deleteAllFolders());
    }

    return { initFoldersPage, teradownFoldersPage }
}

const foldersPage = FoldersPage();
const init = () => foldersPage.initFoldersPage();
const teardown = () => foldersPage.teradownFoldersPage();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);