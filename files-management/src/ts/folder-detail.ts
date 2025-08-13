import type { FileData } from "./custom-types";
import TableStorage from "./supabase-table";

// const folderFileList = document.getElementById('folder-file-list') as HTMLElement;
const tableName = 'files_list';
const urlParams = new URLSearchParams(window.location.search);
const folderId = urlParams.get('id');
const tableStorage = TableStorage<FileData>();

function FolderContents() {
    async function initFolderContents() {
        await tableStorage.realtimeInit({ 
            tableName: tableName,
            callback: (detail) => console.log('Data updated:', detail),
            additionalQuery: (addQuery) => addQuery.eq('folder_id', folderId)
        });
    }

    return { initFolderContents }
}

const folderContents = FolderContents();
const init = () => folderContents.initFolderContents();

document.addEventListener('DOMContentLoaded', init);