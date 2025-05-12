import cloudinaryConfig from "../config/cloudinary-config.js";

type CloudinaryUploadResponse = {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    format: string;
};

const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;

    try {
        const response = await fetch(url, { method: 'POST', body: formData });

        if (!response.ok) throw new Error('Check your internet connection!');
        
        return await response.json();
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

export default uploadToCloudinary;