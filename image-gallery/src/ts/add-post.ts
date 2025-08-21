import DatabaseStorage from "./supabase-table";
import { InsertFile } from "./supabase-storage";
import Modal from "./modal";
import type { GalleryPost } from "./custom-types";
import { getSession, supabase } from "./supabase-config";

class ImageForm extends DatabaseStorage<GalleryPost> {
    private controller: AbortController = new AbortController();
    private imageFiles: File[] = [];
    private notification = document.getElementById("notification_") as HTMLElement;
    private uploaderModal: Modal = new Modal(this.notification);
    private imageTable = 'image_gallery';
    
    private imageUploadField = document.getElementById("image-upload-field") as HTMLFormElement;
    private imageTitle = document.getElementById("image-title") as HTMLInputElement;
    private mediaFile = document.getElementById("media-file") as HTMLInputElement;
    private imagePreviewContainer = document.getElementById("image-preview-container") as HTMLElement;
    private submitButton = document.getElementById("add-post-button") as HTMLButtonElement;
    
    private currentUserId: string | null = null; 
    private currentUsername: string | null = null; 

    constructor() {
        super();
    }

    async initEventListener(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            
            try {
                const { data, error } = await supabase
                .from('image_gallery_user')
                .select('username')
                .eq('id', this.currentUserId)
                .single();

                if (error) {
                    console.error('Error fetching username for uploader:', error.message);
                    this.currentUsername = 'Anonymous User'; // Fallback jika gagal ambil username
                } else if (data && data.username) {
                    this.currentUsername = data.username;
                } else {
                    this.currentUsername = 'Anonymous User'; // Fallback jika tidak ada username
                }
            } catch (error) {                
                this.uploaderModal.createComponent(`Unexpected error fetching username: ${error}`);
                this.uploaderModal.showComponent();
                this.currentUsername = 'Anonymous User'; // Fallback untuk error tak terduga
            }

        } else {
            // Jika tidak login, arahkan kembali ke halaman sign-in
            this.uploaderModal.createComponent("Please sign-in to insert your image");
            this.uploaderModal.showComponent();
            window.location.replace('/html/signin.html');
            return; // Penting untuk menghentikan eksekusi lebih lanjut
        }

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#image-preview-container")) this.mediaFile.click();
        }, { signal: this.controller.signal });

        this.imageUploadField.addEventListener("submit", async (event) => await this.addImage(event), {
            signal: this.controller.signal
        });
        
        this.mediaFile.addEventListener("change", (event) => this.handleImageSelection(event), {
            signal: this.controller.signal
        });
    }

    handleImageSelection(event: Event): void {
        const target = event.target as HTMLInputElement;
        const files = target.files;
        
        if (!files || files.length === 0) return;
        
        // Reset preview container
        this.imagePreviewContainer.innerHTML = '';
        this.imageFiles = [];
        
        // Process each selected file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.imageFiles.push(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (event) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview-item';
                
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.className = 'preview-image';
                img.alt = `Preview ${i + 1}`;
                
                previewDiv.appendChild(img);
                this.imagePreviewContainer.appendChild(previewDiv);
            }
            reader.readAsDataURL(file);
        }
    }
    
    async addImage(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Uploading...';
        
        try {
            if (this.imageFiles.length === 0) {
                throw new Error('Please select at least one image');
            }

            const uploadPromises = this.imageFiles.map(file => InsertFile(file, 'gallery'));
            const imageUrls = await Promise.all(uploadPromises);
            const imageNames = this.imageFiles.map(file => file.name);
            
            if (!this.currentUserId) return;

            await this.insertData({
                tableName: this.imageTable,
                newData: {
                    uploader_name: this.currentUsername || 'Anonymous User',
                    title: this.imageTitle.value.trim() || `gallery_${Date.now()}`,
                    image_name: imageNames,
                    image_url: imageUrls,
                    user_id: this.currentUserId
                }
            });
            
            this.resetForm();
            this.uploaderModal.createComponent('Images uploaded successfully!');
            this.uploaderModal.showComponent();
        } catch (error) {
            this.uploaderModal.createComponent(`${error}`);
            this.uploaderModal.showComponent();
        } finally {
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Upload Images';
        }
    }

    resetForm(): void {
        this.controller.abort();
        this.imageUploadField.reset();
        this.mediaFile.value = '';
        this.imagePreviewContainer.innerHTML = 'No Images Selected';
        this.imageFiles = [];
        this.resetForm();
        this.teardownStorage();
    }
}

const imageForm = new ImageForm();
const init = () => imageForm.initEventListener();
const teardown = () => imageForm.resetForm();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);