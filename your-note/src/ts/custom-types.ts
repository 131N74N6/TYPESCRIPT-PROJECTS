export type Users = {
    id: string;
    created_at: Date;
    email: string;
    username: string;
    password: string;
}

export type Note = {
    id: string;
    created_at: Date;
    note_title: string;
    note_content: string;
    user_id: string;
}

export interface DatabaseProps<I> {
    tableName: string;
    callback: (data: I[]) => void;
    initialQuery?: (query: any) => any;
    relationalQuery?: string;
}

export type InsertDataProps<O> = {
    tableName: string; 
    newData: Omit<O, 'id' | 'created_at'>;
}

export type UpsertDataProps<D> = {
    tableName: string; 
    dataToUpsert: Partial<D>;
}

export type UpdateDataProps<Y> = {
    column: string;
    values: string;
    tableName: string;
    newData: Partial<Omit<Y, 'id' | 'created_at'>>
}

export type DeleteDataProps = {
    tableName: string;
    column?: string;
    values?: string | string[];
}