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

export type UserOpinion = {
    id: string;
    created_at: Date;
    opinions: string;
    username: string;
    user_id: string;
    post_id: string;
}

export type Like = {
    id: string;
    created_at: Date;
    likes_count: number;
    post_id: string;
    user_id: string;
}

export type GalleryDetails = {
    id: string;
    created_at: Date;
    title: string;
    image_url: string[];
    uploader_name: string;
    like_total: number;
    comment_total: number;
    user_liked: boolean;
    post_id: string;
}

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