import type { Note } from "./custom-types";
import Notification from "./modal";
import { getSession, supabase } from "./supabase-config";
import SupabaseTable from "./supabase-table";

const urlParams = new URLSearchParams(window.location.search);
const getNoteId = urlParams.get('id');
const noteTable = 'notes';
const controller = new AbortController();
const noteUserTable = 'note_user';
const username = document.querySelector('#username') as HTMLDivElement;
const newNoteForm = document.getElementById('new-note-form') as HTMLFormElement;
const notification = document.getElementById('add-note-notification') as HTMLElement;
const newNoteTitle = document.getElementById('new-note-title') as HTMLInputElement;
const newNoteContent = document.getElementById('new-note-content') as HTMLTextAreaElement;
const setNotification = new Notification(notification);
let currentUserId: string | null = null;

class DetailNote extends SupabaseTable<Note> {
    constructor() {
        super();
    }

    async initDetailNote(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            currentUserId = session.user.id;
            if (currentUserId) await this.showUserName(currentUserId);
        } else {
            window.location.replace('/index.html');
            return;
        }

        await this.realtimeInit({
            tableName: noteTable,
            callback: (note) => this.showSelectedNote(note),
            initialQuery: (query) => query.eq('id', getNoteId)
        });

        newNoteForm.addEventListener('submit', async (event) => await this.updateNote(event), { 
            signal: controller.signal 
        });
    }

    async showSelectedNote(note: Note[]): Promise<void> {
        newNoteTitle.value = note[0].note_title;
        newNoteContent.value = note[0].note_content;
    }

    async showUserName(userId: string): Promise<void> {
        try {
            const { data, error } = await supabase
            .from(noteUserTable)
            .select('username')
            .eq('id', userId)
            .single();

            if (error) throw error.message;

            if (data && data.username) {
                username.innerHTML = '';
                username.textContent = `Hello, ${data.username}`;
            } else {
                username.innerHTML = '';
                username.textContent = 'Hello, User';
            }
        } catch (error: any) {
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showModal();
            username.innerHTML = '';
            username.textContent = 'User';
        }
    }

    async updateNote(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        try {
            if (!getNoteId) return;

            await this.updateData({
                tableName: noteTable,
                column: 'id',
                values: getNoteId,
                newData: {
                    note_content: newNoteContent.value,
                    note_title: newNoteTitle.value
                },
            });
            window.location.replace('/html/home.html');
        } catch (error: any) {
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showModal();
            newNoteForm.reset();
        }
    }
    
    teardownDetail(): void {
        currentUserId = null;
        controller.abort();
        this.teardownTable();
        setNotification.teardownModal();
        newNoteForm.reset();
    }
}

const detailNote = new DetailNote();
const init = () => detailNote.initDetailNote();
const teardown = () => detailNote.teardownDetail();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);