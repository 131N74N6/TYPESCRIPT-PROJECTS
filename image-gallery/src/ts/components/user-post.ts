import type { GalleryDisplayer, UserGalleryDisplay } from "../custom-types";

export function UserPost(detail: UserGalleryDisplay): HTMLDivElement {
    const link = document.createElement("a") as HTMLAnchorElement;
    link.href = `detail-user-only.html?id=${detail.id}`; 
    link.className = "block";
    
    const imagePost = document.createElement("div") as HTMLDivElement;
    imagePost.className = "image-post-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300";

    const imageWrap = document.createElement("div") as HTMLDivElement;
    imageWrap.className = "image-wrap w-full aspect-square overflow-hidden rounded-t-lg"; 

    detail.image_url.forEach((image_src: string) => {
        const imageContent = document.createElement("img") as HTMLImageElement;
        imageContent.src = image_src;
        imageContent.className = "w-full h-full object-cover block";
        imageWrap.appendChild(imageContent);
    });

    link.appendChild(imageWrap);
    imagePost.appendChild(link);
    return imagePost;
}

export function PublicPost(detail: GalleryDisplayer): HTMLDivElement {
    const link = document.createElement("a") as HTMLAnchorElement;
    link.href = `detail.html?id=${detail.id}`;
    
    const imagePost = document.createElement("div") as HTMLDivElement;
    imagePost.className = "image-post-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300";

    const imageWrap = document.createElement("div") as HTMLDivElement;
    imageWrap.className = "image-wrap w-full aspect-square overflow-hidden rounded-t-lg";

    detail.image_url.forEach((image_src) => {
        const imageContent = document.createElement("img") as HTMLImageElement;
        imageContent.src = image_src;
        imageContent.className = "w-full h-full object-cover block";
        imageWrap.appendChild(imageContent);
    });

    link.append(imageWrap);
    imagePost.append(link);
    return imagePost;
}