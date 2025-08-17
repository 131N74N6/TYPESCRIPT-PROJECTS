import DatabaseStorage from "./supabase-table";
import Modal from "./modal";
import type { GalleryDetails, Like, UserOpinion } from "./custom-types";
import { getSession, supabase } from "./supabase-config";

class PublicGalleryDetail extends DatabaseStorage<GalleryDetails> {
    private urlParams = new URLSearchParams(window.location.search);
    private commentStorage = new DatabaseStorage<UserOpinion>();
    private likeStorage = new DatabaseStorage<Like>();
    private controller = new AbortController();

    private currentUserId: string | null = null;
    private currentUserName: string | null = null;
    private imageId: string | null;
    private currentPost: GalleryDetails | null = null;
    
    private imageTable = "image_gallery";
    private galleryUserTable = 'image_gallery_user';
    private commentPostTable = 'image_gallery_comments';

    private currentIndex = 0;
    private totalSlide = 0;

    private detailPostNotification = document.getElementById("detail-post-notification") as HTMLElement;
    private galleryDetailModal: Modal = new Modal(this.detailPostNotification);

    private uploaderName = document.querySelector("#uploader-name") as HTMLParagraphElement;
    private carouselContainer = document.querySelector("#carousel-container") as HTMLElement; 
    private navigationContainer = document.querySelector("#navigation") as HTMLElement; 
    private imageTitle = document.querySelector("#image-title") as HTMLParagraphElement;
    private uploadedAt = document.querySelector("#created-at") as HTMLParagraphElement;

    private likeButton = document.querySelector("#like-button") as HTMLButtonElement;
    private likeCountElement = document.querySelector("#like-count") as HTMLSpanElement;
    private commentForm = document.querySelector("#comment-maker") as HTMLFormElement;
    private commentInput = document.querySelector("#opinions") as HTMLTextAreaElement;
    private commentsContainer = document.querySelector("#comments-container") as HTMLElement;

    constructor() {
        super();
        this.imageId = this.urlParams.get('id');
    }

    async initDetailPost(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            if (this.currentUserId) await this.getUserName(this.currentUserId);
        } else {
            window.location.replace('/html/signin.html');
        }

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#left-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.prevSlide();
                }
            } else if (target.closest("#right-button")) {
                if (this.totalSlide > 1) { // Hanya geser jika ada lebih dari 1 slide
                    this.nextSlide();
                }
            } 
        }, { signal: this.controller.signal });

        this.likeButton.addEventListener("click", () => this.handleLike(), {
            signal: this.controller.signal
        });

        this.commentForm.addEventListener("submit", async (event) => this.handleCommentSubmit(event), {
            signal: this.controller.signal
        });

        await this.realtimeInit({
            tableName: this.imageTable,
            callback: (images) => {this.showDetailPost(images); console.log(images)},
            initialQuery: (addQuery) => addQuery.eq('id', this.imageId),
            relationalQuery: `
                id, created_at, uploader_name, title, like_count, image_url,
                image_gallery_comments (id, username, opinions, user_id), 
                likes_data_from_image_gallery (id)
            `
        });

        await this.commentStorage.realtimeInit({
            tableName: this.commentPostTable,
            callback: (comments) => this.showAllComments(comments),
            initialQuery: (query) => query.eq('post_id', this.imageId)
        });

        await this.likeStorage.realtimeInit({
            tableName: "likes_data_from_image_gallery",
            callback: (likes) => this.updateLikeStatus(likes),
            initialQuery: (query) => query.eq('post_id', this.imageId)
        });
    }

    private async getUserName(userId: string): Promise<void> {
        try {            
            const { data, error } = await supabase
            .from(this.galleryUserTable)
            .select('username')
            .eq('id', userId)
            .single();

            if (error) throw error.message;

            this.currentUserName = data.username;
        } catch (error: any) {
            this.currentUserName = error.message || error;
            this.galleryDetailModal.createComponent(`Error: ${error.message || error}`);
            this.galleryDetailModal.showComponent();
        }
    }

    private showDetailPost(post: GalleryDetails[]) {
        if (post.length === 0) {
            this.displayMessage('Image not found or has been deleted');
            return;
        }

        this.currentPost = post[0];
        this.createSliderComponent(this.currentPost);
        this.updateLikeUI();
    }

    private createSliderComponent(detail: GalleryDetails): void {
        this.carouselContainer.innerHTML = ''; 

        detail.image_url.forEach((image, index) => {
            const imageWrap = document.createElement("div") as HTMLDivElement;
            imageWrap.className = "flex-shrink-0 w-full h-full relative overflow-hidden";

            const imageElement = document.createElement("img") as HTMLImageElement;
            imageElement.className = "w-full h-full object-contain block";
            imageElement.src = image;
            imageElement.alt = `${detail.title} - Image ${index + 1}`;

            imageWrap.appendChild(imageElement);
            this.carouselContainer.appendChild(imageWrap);
        });

        this.uploaderName.textContent = detail.uploader_name;
        this.imageTitle.textContent = detail.title;
        this.uploadedAt.textContent = `Uploaded at: ${new Date(detail.created_at).toLocaleString()}`;

        // Perbarui totalSlide dan reset currentIndex
        this.totalSlide = detail.image_url.length;
        this.currentIndex = 0;

        // Tampilkan/sembunyikan navigasi
        this.navigationContainer.style.display = this.totalSlide > 1 ? 'flex' : 'none'; // Tampilkan hanya jika ada lebih dari 1 gambar

        // Panggil updateCarousel untuk memastikan tampilan awal benar
        this.updateCarousel();
    }

    private displayMessage(message: string): void {
        this.carouselContainer.innerHTML = `<p style="text-align: center; padding: 20px;">${message}</p>`;
        this.imageTitle.textContent = ''; 
        this.uploadedAt.textContent = '';
    }

    updateCarousel(): void {
        if (!this.carouselContainer || this.totalSlide === 0) return;

        if (this.currentIndex < 0) {
            this.currentIndex = this.totalSlide - 1;
        } else if (this.currentIndex >= this.totalSlide) {
            this.currentIndex = 0;
        }

        this.carouselContainer.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }

    prevSlide(): void {
        this.currentIndex--;
        this.updateCarousel();
    }

    nextSlide(): void {
        this.currentIndex++;
        this.updateCarousel();
    }

    private resetCarouselState(): void {
        this.currentIndex = 0;
        this.totalSlide = 0;
    }

    private async handleLike(): Promise<void> {
        if (!this.currentUserId || !this.imageId) return;

        try {
            const existingLike = this.likeStorage.toArray()
            .find(like => like.user_id === this.currentUserId && like.post_id === this.imageId);

            if (existingLike) {
                // Unlike
                await this.likeStorage.deleteData({
                    tableName: "likes_data_from_image_gallery",
                    column: "id",
                    values: existingLike.id
                });
            } else {
                // Like
                await this.likeStorage.insertData({
                    tableName: "likes_data_from_image_gallery",
                    newData: {
                        user_id: this.currentUserId,
                        post_id: this.imageId
                    }
                });
            }
        } catch (error) {
            this.galleryDetailModal.createComponent(`Failed to update like: ${error}`);
            this.galleryDetailModal.showComponent();
        }
    }

    private updateLikeStatus(likes: Like[]): void {
        if (!this.currentPost) return;
        
        // Update like count
        this.currentPost.like_count = likes.length;
        this.likeCountElement.textContent = likes.length.toString();
        
        // Update button appearance
        const userLiked = !!likes.find(like => like.user_id === this.currentUserId);
        const likeIcon = this.likeButton.querySelector('i');
        
        if (likeIcon) {
            likeIcon.className = userLiked ? 'fas fa-heart text-xl' : 'far fa-heart text-xl';
            this.likeButton.classList.toggle('text-red-500', userLiked);
        }
    }

    private showAllComments(comments: UserOpinion[]): void {
        this.commentsContainer.innerHTML = '';

        if (comments.length === 0) {
            this.commentsContainer.innerHTML = `
                <p class="text-gray-500 text-center py-4">No comments yet</p>
            `;
            return;
        }

        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'bg-gray-50 p-4 rounded-lg';
            commentElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <strong class="text-gray-800">${comment.username}</strong>
                        <p class="text-gray-600 mt-1">${comment.opinions}</p>
                    </div>
                    <span class="text-gray-400 text-sm">${new Date(comment.created_at).toLocaleTimeString()}</span>
                </div>
            `;
            this.commentsContainer.appendChild(commentElement);
        });
    }

    private async handleCommentSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        if (!this.currentUserId || !this.imageId) return;
        if (!this.currentUserName) return;
        
        const commentText = this.commentInput.value.trim();
        if (!commentText) return;

        try {
            await this.commentStorage.insertData({
                tableName: this.commentPostTable,
                newData: {
                    post_id: this.imageId,
                    user_id: this.currentUserId,
                    opinions: commentText,
                    username: this.currentUserName 
                }
            });
        } catch (error: any) {
            this.galleryDetailModal.createComponent(`Failed to add comment: ${error.message || error}`);
            this.galleryDetailModal.showComponent();
        } finally {
            this.commentInput.value = '';
        }
    }

    private updateLikeUI(): void {
        if (!this.currentPost) return;
        this.likeCountElement.textContent = this.currentPost.like_count.toString();
    }

    teardownPostDetail(): void {
        this.teardownStorage();
        this.controller.abort();
        this.resetCarouselState();
        this.imageId = null;
        this.currentUserId = null;
        this.currentUserName = null;
        this.currentPost = null;
        this.galleryDetailModal.teardownComponent();
        this.carouselContainer.innerHTML = '';
        this.imageTitle.textContent = '';
        this.uploadedAt.textContent = '';
        this.navigationContainer.style.display = 'none';
    }
}

const publicGalleryDetail = new PublicGalleryDetail();
const init = () => publicGalleryDetail.initDetailPost();
const teardown = () => publicGalleryDetail.teardownPostDetail();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);