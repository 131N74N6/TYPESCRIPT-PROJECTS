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

export interface DatabaseProps<B> {
    callback: (data: B[]) => void;
    initialQuery?: (query: any) => any;
}