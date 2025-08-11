export type DatabaseProps<J> = {
    callback: (data: J[]) => void;
    additionalQuery?: (query: any) => any;
}

export type FileData = {
    id: string;
    created_at: Date;
    file_name: string;
    file_type: string;
    file_url: string;
    user_id: string;
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
    username: HTMLDivElement; 
    modal: HTMLElement; 
    searchInput: HTMLInputElement; 
    checkboxCategory: NodeListOf<HTMLInputElement>;
    sortingData: HTMLSelectElement;
    navbar: HTMLElement;
    fileViewer: HTMLElement;
    fileContent: HTMLElement;
}