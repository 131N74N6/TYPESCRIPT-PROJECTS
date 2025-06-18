import DatabaseStorage from "./supabase-table";
import { InsertFile } from "./supabase-storage";
import Modal from "./modal";
import type { GalleryPost } from "./interfaces";

class ImageForm extends DatabaseStorage<GalleryPost> {
    controller: AbortController = new AbortController();
    imageFiles: File[] = [];
    private notification = document.getElementById("notification_") as HTMLElement;
    private uploaderModal: Modal = new Modal(this.notification);
    
    private imageUploadField = document.getElementById("image-upload-field") as HTMLFormElement;
    private uploaderName = document.getElementById("uploader-name") as HTMLInputElement;
    private imageTitle = document.getElementById("image-title") as HTMLInputElement;
    private mediaFile = document.getElementById("media-file") as HTMLInputElement;
    private imagePreviewContainer = document.getElementById("image-preview-container") as HTMLElement;
    private submitButton = document.getElementById("add-post-button") as HTMLButtonElement;

    constructor() {
        super("image_gallery");
    }

    initEventListener(): void {
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
            
            await this.addToDatabase({
                created_at: new Date(),
                uploader_name: this.uploaderName.value.trim() || `user_${Date.now()}`,
                title: this.imageTitle.value.trim() || `gallery_${Date.now()}`,
                image_name: imageNames,
                image_url: imageUrls
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
        this.imagePreviewContainer.innerHTML = '';
        this.imageFiles = [];
    }
}

const imageForm = new ImageForm();

function initForm(): void {
    imageForm.initEventListener();
}

function teardownForm(): void {
    imageForm.teardownStorage();
    imageForm.resetForm();
}

document.addEventListener("DOMContentLoaded", initForm);
window.addEventListener("beforeunload", teardownForm);