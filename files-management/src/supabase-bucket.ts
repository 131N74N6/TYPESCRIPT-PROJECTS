import supabase from "./supabase-config";

async function uploadToSupabaseStorage(file: File, bucketName: string): Promise<string> {
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
        // Ini jarang terjadi jika uploadData berhasil, tapi baik untuk diperiksa
        throw new Error('Failed to get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
}

export default uploadToSupabaseStorage;