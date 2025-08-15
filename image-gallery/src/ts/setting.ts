import type { GalleryPost } from "./custom-types";
import Modal from "./modal";
import { getSession, supabase } from "./supabase-config";
import { RemoveFile } from "./supabase-storage";
import DatabaseStorage from "./supabase-table";

class Settings extends DatabaseStorage<GalleryPost> {
    private imageTable = 'image_gallery';
    private currentUserId: string | null = null;
    private username = document.getElementById('signed-in-username') as HTMLDivElement;
    private settingNotification = document.getElementById('setting-notification') as HTMLElement;
    private deleteAllPostBtn = document.getElementById('delete-all-post') as HTMLButtonElement;
    private notification = new Modal(this.settingNotification);
    private bucketName = 'gallery';
    private allFilesUrl: string[] = [];

    constructor() {
        super();
    }

    async initSettings(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            this.currentUserId = session.user.id;
            if (this.currentUserId) await this.showUserName(this.currentUserId);
        } else {
            this.notification.createComponent('Please signin to use this setting');
            this.notification.showComponent();
            return;
        }

        this.deleteAllPostBtn.addEventListener('click', async () => await this.deleteAllPost());
    }

    async showUserName(userId: string): Promise<void> {
        try {
            const { data, error } = await supabase
            .from('image_gallery_user')
            .select('username')
            .eq('id', userId)
            .single();

            if (error) throw error.message;

            if (data && data.username) {
                this.username.innerHTML = '';
                this.username.textContent = `Hello, ${data.username}`;
            } else {
                this.username.innerHTML = '';
                this.username.textContent = 'Hello, User';
            }
        } catch (error: any) {
            this.username.innerHTML = '';
            this.username.textContent = 'Hello, User';
            this.notification.createComponent(error.message || error);
            this.notification.showComponent();
        }
    }

    async deleteAllPost(): Promise<void> {
        try {
            if (!this.currentUserId) return;

            const { data: allPost, error: allPostError } = await supabase
            .from('image_gallery')
            .select('image_url')
            .eq('user_id', this.currentUserId);

            if (allPostError) throw allPostError.message;

            if (allPost.length > 0) {
                allPost.forEach((post) => {
                    if (Array.isArray(post.image_url)) {
                        this.allFilesUrl.push(...post.image_url);
                    } else if (typeof post.image_url === 'string') {
                        this.allFilesUrl.push(post.image_url);
                    }
                });

                const deletePromises = this.allFilesUrl.map(url => RemoveFile(url, this.bucketName));
                await Promise.all(deletePromises)
            }

            await this.deleteData({
                tableName: this.imageTable,
                column: 'user_id',
                values: this.currentUserId
            });
        } catch (error: any) {
            this.notification.createComponent(error.message || error);
            this.notification.showComponent();
        }
    }

    teardownSettings(): void {
        this.notification.teardownComponent();
        this.teardownStorage();
        this.deleteAllPostBtn.addEventListener('click', async () => await this.deleteAllPost());
        this.currentUserId = null;
    }
}

const loadSettings = new Settings();
const init = () => loadSettings.initSettings();
const teardown = () => loadSettings.teardownSettings();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);