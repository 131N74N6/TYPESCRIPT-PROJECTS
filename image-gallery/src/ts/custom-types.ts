export type GalleryPost = {
    id: string;
    uploader_name: string;
    created_at: Date;
    image_name: string[];
    image_url: string[];
    title: string;
}

export type GalleryDisplayer = Exclude<GalleryPost, 'uploader_name' | 'created_at' | 'image_name'>;

export type GalleryDetails = Exclude<GalleryPost, 'image_name'>;

export type Users = {
    id: string;
    created_at: string;
    username: string;
    password: string;
}

export type PrivateUsers = Exclude<Users, 'password'>;