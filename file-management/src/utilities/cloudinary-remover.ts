async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        const response = await fetch(`/delete-cloudinary-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId }),
        });
        if (!response.ok) throw new Error('Gagal menghapus file dari Cloudinary');
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export default deleteFromCloudinary;