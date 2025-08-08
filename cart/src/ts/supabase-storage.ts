import { supabase } from "./supabase-config";

async function InsertFile(storageName: string, file: File): Promise<string> {
    const changedFileName = file.name
    .replace(/[^\w\s.-]/gi, '') // Hapus karakter khusus
    .replace(/\s+/g, '-');       // Ganti spasi dengan dash

    const fileName = `${Date.now()}-${changedFileName}`;

    const { data: uploadedFile, error } = await supabase.storage
    .from(storageName)
    .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
    });

    if (error) throw error;

    const { data: publicUrlFile } = supabase.storage
    .from(storageName)
    .getPublicUrl(uploadedFile.path);

    if (!publicUrlFile || !publicUrlFile.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.');
    }

    return publicUrlFile.publicUrl;
}

async function RemoveFile(imageUrl: string, storageName: string): Promise<void> {
    if (imageUrl) {
        const path = imageUrl.split(`${storageName}/`)[1];
        if (path) {
            const { error } = await supabase.storage
            .from(storageName)
            .remove([decodeURIComponent(path)]);
            
            if (error) throw error;
        }
    }
}

export { InsertFile, RemoveFile }