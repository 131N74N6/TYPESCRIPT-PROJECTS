import type { FolderData } from "./custom-types";
import Modal from "./modal";
import { getSession, supabase } from "./supabase-config";
import TableStorage from "./supabase-table";

const username = document.getElementById('username') as HTMLElement;
const insertFolderForm = document.getElementById('make-folder-section') as HTMLFormElement;
const folderName = document.getElementById('folder-name') as HTMLInputElement;
const modal = document.getElementById('folder-notification') as HTMLElement;
const changeFolderForm = document.getElementById('change-folder-section') as HTMLFormElement;
const newFolderName = document.getElementById('new-folder-name') as HTMLInputElement;
const folderList = document.getElementById('folder-list') as HTMLElement;
const tableName = 'folder_list';
const controller = new AbortController();
const tableStorages = TableStorage<FolderData>();
let currentUserId: string | null = null;
let selectedFolderId: string | null = null;

function FoldersPage() {
    const notificationSetter = Modal(modal);

    async function initFoldersPage(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            currentUserId = session.user.id;
            if (currentUserId) await showUserName(currentUserId);
        } else {
            notificationSetter.createModal('Please sign in to add folder');
            notificationSetter.showMessage();
            return;
        }
        
        insertFolderForm.addEventListener('submit', async (event) => await insertNewFolder(event), {
            signal: controller.signal
        });

        await tableStorages.realtimeInit(tableName, {
            callback: (folders) => showAllFolders(folders),
            additionalQuery: (query) => query.eq('user_id', currentUserId)
        });

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#show-folder-form')) openInsertFolderForm();
            else if (target.closest('#close-folder-form')) closeInsertFolderForm();
            else if (target.closest('#show-insert-folder-form')) openChangeFolderForm();
            else if (target.closest('#close-change-folder-form')) closeChangeFolderForm();
        }, { signal: controller.signal });
    }

    async function showUserName(id: string) {
        try {    
            const { data, error } = await supabase
            .from('cloud_user')
            .select('username')
            .eq('id', id)
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

    function openInsertFolderForm(): void {
        insertFolderForm.classList.remove('hidden');
        insertFolderForm.classList.add('flex');
    }

    function closeInsertFolderForm(): void {
        insertFolderForm.classList.remove('flex');
        insertFolderForm.classList.add('hidden');
    }

    function openChangeFolderForm(): void {
        changeFolderForm.classList.remove('hidden');
        changeFolderForm.classList.add('flex');
    }

    function closeChangeFolderForm(): void {
        changeFolderForm.classList.remove('flex');
        changeFolderForm.classList.add('hidden');
    }

    async function insertNewFolder(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedFolderName = folderName.value.trim();

        if (!currentUserId) return;

        if (trimmedFolderName === '') throw 'Missing required data';

        try {
            await tableStorages.addToStorage(tableName, {
                folder_name: trimmedFolderName,
                user_id: currentUserId
            });
        } catch (error: any) {
            notificationSetter.createModal(`Error: ${error.message || error}`);
            notificationSetter.showMessage();
        } finally {
            insertFolderForm.reset();
            closeInsertFolderForm();
        }
    }

    function showAllFolders(filesData: FolderData[]): void {
        const fileDataFragment = document.createDocumentFragment();
        try {
            if (filesData.length > 0) {

                filesData.forEach(data => fileDataFragment.appendChild(createComponent(data)));
                folderList.innerHTML = '';
                folderList.appendChild(fileDataFragment);
            } else {
                folderList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">No files added...</div>`;
            }
        } catch (error: any) {
            notificationSetter.createModal(`Failed to load data: ${error.message || error}`);
            notificationSetter.showMessage();
            folderList.innerHTML = `<div class="text-[2rem] text-[#FFFFFF]">Error ${error.message || error}...</div>`;
        }
    }

    function createComponent(detail: FolderData) {
        const link = document.createElement('a') as HTMLAnchorElement;
        link.href = `folder-detail.html?id=${detail.id}`;

        const card = document.createElement('div');
        card.className = 'border-[#B71C1C] border-[1.8px] text-[#FFFFFF] shadow-[3px_3px_#B71C1C] p-[1rem] flex flex-col gap-[0.5rem] rounded-[1rem] font-[520]';
        card.dataset.id = detail.id.toString();

        const folderIcon = document.createElement('div') as HTMLDivElement;
        folderIcon.className = 'fa-solid fa-folder text-[#FFFFFF] font-[550] text-[0.9rem]'
        const folderName = document.createElement('h3');
        folderName.className = 'file-name';
        folderName.textContent = `File: ${detail.folder_name}`;

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
        
        const documentMeta = document.createElement('div');
        documentMeta.className = 'flex flex-col gap-[0.5rem]';
        documentMeta.append(folderIcon, folderName, uploadTime);

        const documentAction = document.createElement('div');
        documentAction.className = 'flex flex-wrap gap-[0.7rem]';
        documentAction.append(selectButton, deleteButton);
        
        card.append(documentMeta, documentAction);
        link.append(card);
        return link;
    }

    function teradownFoldersPage(): void {
        controller.abort();
        notificationSetter.teardown();
        insertFolderForm.reset();
        closeInsertFolderForm();
    }

    return { initFoldersPage, teradownFoldersPage }
}

const foldersPage = FoldersPage();
const init = () => foldersPage.initFoldersPage();
const teardown = () => foldersPage.teradownFoldersPage();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);