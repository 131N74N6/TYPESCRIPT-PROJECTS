import SupabaseTable from "./supabase-table";
import type { Note } from "./custom-types";
import { getSession, supabase } from "./supabase-config";

let currentUserId: string | null = null;
const noteUserTable = 'note_user';
const noteTable = 'notes';
const username = document.querySelector('#username') as HTMLDivElement;
const noteList = document.getElementById('note-list') as HTMLElement;
const deleteAllButton = document.getElementById('delete-all-notes') as HTMLButtonElement;

class HomePage extends SupabaseTable<Note> {
    constructor() {
        super();
    }

    async initHomePage(): Promise<void> {
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
            callback: (notes) => this.showAllNotes(notes),
            initialQuery: (addQuery) => addQuery.eq('user_id', currentUserId)
        });
        
        deleteAllButton.onclick = async () => await this.deleteAllNotes();
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
            username.textContent = `Error: ${error.message || error}`;
        }
    }

    showAllNotes(notes: Note[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (notes.length > 0) {
                notes.forEach(note => fragment.appendChild(this.createNoteComponent(note)));
                noteList.innerHTML = '';
                noteList.appendChild(fragment);
            } else {
                throw 'No Note Added Recently...';
            }
        } catch (error: any) {
            noteList.innerHTML = '';
            noteList.textContent = `${error.message || error}`;
        }
    }

    createNoteComponent(note: Note): HTMLDivElement {
        const cardNote = document.createElement('div') as HTMLDivElement;
        cardNote.id = `note-card-${note.id}`;
        cardNote.dataset.id = note.id;
        cardNote.className = 'border-[1.9px] p-[0.5rem] rounded-[0.5rem] text-[#FA198B] text-[0.9rem] bg-[#000000]';

        const noteTitle = document.createElement('div') as HTMLDivElement;
        noteTitle.id = 'note-title';
        noteTitle.textContent = note.note_title;
        noteTitle.className = 'font-[580] text-[1.3rem] capitalize';

        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.id = 'created-at';
        createdAt.textContent = `${note.created_at.toLocaleString()}`;

        const noteContent = document.createElement('div') as HTMLDivElement;
        noteContent.id = 'note-content';
        noteContent.className = 'h-[300px] overflow-hidden';
        noteContent.textContent = note.note_content;

        const viewButton = document.createElement('button') as HTMLButtonElement;
        viewButton.type = 'button';
        viewButton.id = 'view-button';
        viewButton.className = 'bg-[#31081F] p-[0.4rem] text-[#FA198B] cursor-pointer text-[0.9rem] rounded-[0.4rem] w-[85px]';
        viewButton.textContent = 'View';
        viewButton.onclick = () => window.location.replace(`/html/detail-note.html?id=${note.id}`);

        const removeButton = document.createElement('button') as HTMLButtonElement;
        removeButton.id = 'remove-button';
        removeButton.type = 'button';
        removeButton.textContent = 'Delete';
        removeButton.className = 'bg-[#31081F] p-[0.4rem] text-[#FA198B] cursor-pointer text-[0.9rem] rounded-[0.4rem] w-[85px]';
        removeButton.onclick = async () => await this.deleteData({
            tableName: noteTable,
            column: 'id',
            values: note.id
        });

        const burronWrap = document.createElement('div') as HTMLDivElement;
        burronWrap.id = 'button-wrap';
        burronWrap.className = 'flex gap-[0.5rem] mt-[0.5rem]';
        burronWrap.append(viewButton, removeButton);

        cardNote.append(noteTitle, createdAt, noteContent, burronWrap);
        return cardNote;
    }

    teardownHomePage(): void {
        this.teardownTable();
        currentUserId = null;
    }

    async deleteAllNotes(): Promise<void> {
        try {
            if (this.currentData.size > 0) {
                await this.deleteData({ tableName: noteTable });
                noteList.innerHTML = '';
                noteList.textContent = 'No Note Added...';
            } else {
                noteList.innerHTML = '';
                noteList.textContent = 'No Note Added...';
                throw 'No Note Added Recently...';
            }
        } catch (error: any) {
            noteList.innerHTML = '';
            noteList.textContent = `${error.message || error}`;
        }
    }
}

const homePage = new HomePage();
const init = () => homePage.initHomePage();
const teardown = () => homePage.teardownHomePage();

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);