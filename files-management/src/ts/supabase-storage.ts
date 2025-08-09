import supabase from "./supabase-config";

function SupabaseStorage() {
    async function InsertFile(file: File, bucketName: string): Promise<string> {
        const sanitizedFileName = file.name
        .replace(/[^\w\s.-]/gi, '') // Hapus karakter khusus
        .replace(/\s+/g, '-');       // Ganti spasi dengan dash

        const fileName = `${Date.now()}-${sanitizedFileName}`;

        const { data: uploadData, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false
        });

        if (error) {
            console.error('Upload error:', error);
            throw error;
        }

        // Gunakan getPublicUrl() untuk mendapatkan URL publik
        const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path); // uploadData.path berisi path lengkap file di bucket

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Failed to get public URL for the uploaded file.');
        }

        return publicUrlData.publicUrl;
    }

    async function RemoveFile(fileUrl: string, bucketName: string): Promise<void> {
        const filePath = fileUrl.split(`${bucketName}/`)[1];
        const { error } = await supabase.storage
        .from(bucketName)
        .remove([decodeURIComponent(filePath)]);
        
        if (error) throw error;
    }

    return { InsertFile, RemoveFile }
}

export default SupabaseStorage;