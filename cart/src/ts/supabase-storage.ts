import supabase from "./supabase-config";

export default async function uploadToSupabaseStorage(storageName: string, file: File): Promise<string> {
    const changedFileName = file.name
    .replace(/[^\w\s.-]/gi, '') // Hapus karakter khusus
    .replace(/\s+/g, '-');       // Ganti spasi dengan dash

    const fileName = `${Date.now()}-${changedFileName}`;

    const { data: uploadedData, error } = await supabase.storage
    .from(storageName)
    .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false
    });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
    .from(storageName)
    .getPublicUrl(uploadedData.path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL for the uploaded file.');
    }

    return publicUrlData.publicUrl;
}