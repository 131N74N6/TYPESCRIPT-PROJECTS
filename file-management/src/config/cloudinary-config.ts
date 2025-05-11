type CloudinaryConfig = {
    cloudName: string;
    apiKey: string;
    uploadPreset: string;
}

const cloudinaryConfig: CloudinaryConfig = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
}

export default cloudinaryConfig;