export type FileData = {
    id: string;
    created_at: Date;
    uploader_name: string;
    file_name: string;
    file_type: string;
    file_url: string;
}

export type User = {
    id: string;
    email: string;
    username: string;
    password: string;
}

export type CloudStorageProps = {
    fileUploaderForm: HTMLFormElement; 
    fileInput: HTMLInputElement; 
    documentsList: HTMLElement;
    preview: HTMLDivElement; 
    submitButton: HTMLButtonElement; 
    username: HTMLInputElement; 
    modal: HTMLElement; 
    searchInput: HTMLInputElement; 
    checkboxCategory: NodeListOf<HTMLInputElement>;
    sortingData: HTMLSelectElement
}