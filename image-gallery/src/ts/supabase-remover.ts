import supabase from "./supabase-config";
import type { GalleryDetails } from "./interfaces";

async function deleteFromSupabaseStorage(postDetail: GalleryDetails, storageBucketName: string): Promise<void> {
    if (postDetail.image_url && postDetail.image_url.length > 0) {
        const filePathsToDelete: string[] = [];
        postDetail.image_url.forEach(url => {
            // Ekstrak path file dari URL.
            // URL Supabase Storage biasanya berbentuk:
            // https://<project_id>.supabase.co/storage/v1/object/public/<bucket_name>/path/to/file.jpg
            // Kita hanya butuh '/path/to/file.jpg' relatif terhadap bucket.
            // Asumsi: path di storage sama dengan yang disimpan di image_url setelah bucket_name
            const pathSegment = `${url.split(storageBucketName)[1]}/`;
            const startIndex = url.indexOf(pathSegment);
            if (startIndex !== -1) {
                // Tambahkan 7 untuk melewati 'public/' agar hanya path relatif di dalam bucket
                const filePath = url.substring(startIndex + pathSegment.length);
                filePathsToDelete.push(filePath);
            } else {
                console.warn(`Could not extract file path from URL: ${url}. Skipping deletion for this file.`);
            }
        });

        if (filePathsToDelete.length > 0) {
            const { error } = await supabase.storage
            .from(storageBucketName)
            .remove(filePathsToDelete);

            if (error) throw error;
        }
    }
}

export default deleteFromSupabaseStorage;