export type DatabaseProps<J> = {
    tableName: string;
    callback: (data: J[]) => void;
    additionalQuery?: (query: any) => any;
    relationalQuery?: string;
}

export type InsertDataProps<M> = {
    tableName: string; 
    data: Omit<M, 'id' | 'created_at'>;
}

export type UpdateSelectedDataProps<K> = {
    id: string; 
    tableName: string; 
    newData: Partial<Omit<K, 'id' | 'created_at'>>;
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

export type FolderData = {
    id: string;
    created_at: Date;
    folder_name: string;
    user_id: string;
}