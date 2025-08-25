import SupabaseTable from "./supabase-table";
import type { Note } from "./custom-types";
import Notification from "./modal";
import { getSession, supabase } from "./supabase-config";

const controller = new AbortController();
const noteTable = 'notes';
const noteUserTable = 'note_user';
const username = document.querySelector('#username') as HTMLDivElement;
const noteForm = document.getElementById('note-form') as HTMLFormElement;
const notification = document.getElementById('add-note-notification') as HTMLElement;
const noteTitle = document.getElementById('note-title') as HTMLInputElement;
const noteContent = document.getElementById('note-content') as HTMLTextAreaElement;
const setNotification = new Notification(notification);

let currentUserId: string | null = null;

class NoteForm extends SupabaseTable<Note> {
    constructor() {
        super();
    }

    async initNoteForm(): Promise<void> {
        const session = await getSession();
        if (session && session.user) {
            currentUserId = session.user.id;
            if (currentUserId) await this.showUserName(currentUserId);
        } else {
            window.location.replace('/html/index.html');
            return;
        }

        noteForm.addEventListener('submit', async (event) => await this.insertNewNote(event), {
            signal: controller.signal
        });
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
            username.innerHTML = '';
            username.textContent = 'User';
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showModal();
        }
    }

    async insertNewNote(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedTitle = noteTitle.value.trim();

        try {
            if (trimmedTitle === '' || noteContent.value === '') throw 'Missing required data! Please complete it';

            if (!currentUserId) return;

            await this.insertData({
                tableName: noteTable,
                newData: {
                    note_title: trimmedTitle,
                    note_content: noteContent.value,
                    user_id: currentUserId
                }
            });
            window.location.replace('/html/home.html');
        } catch (error: any) {
            setNotification.createModal(`Error: ${error.message || error}`);
            setNotification.showModal();
        } finally {
            noteForm.reset();
        }
    }

    teardownNoteForm(): void {
        controller.abort();
        noteForm.reset();
        setNotification.teardownModal();
        currentUserId = null;
        this.teardownTable();
    }
}

const form = new NoteForm();
const init = () => form.initNoteForm();
const teardown = () => form.teardownNoteForm();

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', teardown);