export interface GalleryPost {
    id: string;
    uploader_name: string;
    created_at: Date;
    image_name: string[];
    image_url: string[];
    title: string;
}

export interface GalleryDisplayer {
    id: string;
    title: string;
    image_url: string[];
}

export interface GalleryDetails {
    id: string;
    image_url: string[];
    uploader_name: string;
    title: string;
    created_at: Date;
}
