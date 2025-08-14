export type GalleryPost = {
    id: string;
    uploader_name: string;
    created_at: Date;
    image_name: string[];
    image_url: string[];
    title: string;
    user_id: string;
}

export type GalleryDisplayer = Pick<GalleryPost, 'id' | 'image_url' | 'title'>;

export type GalleryDetails = Pick<GalleryPost, 'id' | 'created_at' | 'title' | 'uploader_name' | 'image_url'>;

export type Users = {
    id: string;
    created_at: Date;
    email: string;
    username: string;
    password: string;
}

export type PrivateUsers = Pick<Users, 'username' | 'created_at'>;

export type UserGalleryDisplay = GalleryDisplayer & {
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
    id: string;
    tableName: string;
    newData: Partial<Omit<Y, 'id' | 'created_at'>>
}

export type DeleteDataProps = {
    tableName: string;
    column?: string;
    values?: string | string[];
}