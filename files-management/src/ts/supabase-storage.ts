import type { FileBucketProps } from "./custom-types";
import { supabase } from "./supabase-config";

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

    async function RenameFile(props: FileBucketProps): Promise<string> {
        let sanitizedFileName = props.newFileName
        .replace(/[^a-z0-9\s._-]/gi, '')
        .replace(/\s+/g, '-');

        // 2. Ekstrak path dari URL
        const urlObj = new URL(props.oldFilePath);
        const fullPath = urlObj.pathname;
        
        // 3. Ekstrak path relatif
        const bucketPathRegex = new RegExp(`/${props.bucketName}/(.+)`);
        const match = fullPath.match(bucketPathRegex);
        
        if (!match || !match[1]) throw new Error('Bucket name not found in file path');
        
        const relativePath = match[1];
        
        // 4. Ekstrak direktori dan nama file
        const lastSlashIndex = relativePath.lastIndexOf('/');
        const directory = lastSlashIndex >= 0 ? relativePath.substring(0, lastSlashIndex + 1) : '';
        const oldFileName = lastSlashIndex >= 0 ? relativePath.substring(lastSlashIndex + 1) : relativePath;
        
        // 5. Ekstrak ekstensi asli dengan benar
        const dotIndex = oldFileName.lastIndexOf('.');
        const hasExtension = dotIndex > 0; // Pastikan bukan file hidden (.filename)
        const extension = hasExtension ? oldFileName.substring(dotIndex) : '';

        // 6. Hapus ekstensi dari nama file baru jika sudah ada
        const newFileDotIndex = sanitizedFileName.lastIndexOf('.');
        if (newFileDotIndex > 0) {
            sanitizedFileName = sanitizedFileName.substring(0, newFileDotIndex);
        }

        // 7. Format nama file baru
        const newFileNameWithTimestamp = `${Date.now()}-${sanitizedFileName}${extension}`;
        const newRelativePath = `${directory}${newFileNameWithTimestamp}`;
        
        // 8. Salin file ke lokasi baru
        const { error: copyError } = await supabase.storage
            .from(props.bucketName)
            .copy(relativePath, newRelativePath);
        
        if (copyError) {
            throw new Error(`Copy failed: ${copyError.message}`);
        }
        
        // 9. Hapus file lama
        const { error: removeError } = await supabase.storage
            .from(props.bucketName)
            .remove([relativePath]);
        
        if (removeError) throw `Failed to remove old file': ${removeError.message}`;
        
        // 10. Dapatkan URL publik baru
        const { data: publicUrlData } = supabase.storage
            .from(props.bucketName)
            .getPublicUrl(newRelativePath);
        
        if (!publicUrlData?.publicUrl) {
            throw new Error('Failed to generate public URL');
        }
        
        return publicUrlData.publicUrl;
    }

    return { InsertFile, RenameFile, RemoveFile }
}

export default SupabaseStorage;