import TableStorage from "./supabase-table";
import type { Note } from "./type-interface";

const tableStorage = TableStorage<Note>('notes');
const noteList = document.getElementById('note-list') as HTMLElement;

const NoteManager = () => {
    const initEventListeners = async (): Promise<void> => {
        tableStorage.realtimeInit((notes) => showAllNotes(notes));
    }

    const showAllNotes = (notes: Note[]): void => {
        const fragment = document.createDocumentFragment();
        try {
            if (notes.length > 0) {
                notes.forEach(note => fragment.appendChild(createNoteComponent(note)));
                noteList.innerHTML = '';
                noteList.appendChild(fragment);
            } else {
                noteList.innerHTML = '';
                const errorMessage = document.createElement('div') as HTMLDivElement;
                errorMessage.className = 'h-[90dvh] text-[#B91372] flex justify-center align-middle text-[2rem] font-[550]';
                errorMessage.textContent = 'No Note Added...';
                noteList.appendChild(errorMessage);
            }
        } catch (error: any) {
            noteList.innerHTML = '';
            const errorMessage = document.createElement('div') as HTMLDivElement;
            errorMessage.className = 'h-[90dvh] text-[#B91372] flex justify-center align-middle text-[2rem] font-[550]';
            errorMessage.textContent = `Error: ${error.message || error}`;
            noteList.appendChild(errorMessage);
        }
    }

    const createNoteComponent = (note: Note): HTMLDivElement => {
        const cardNote = document.createElement('div') as HTMLDivElement;
        cardNote.id = 'note-card';
        cardNote.dataset.id = note.id;

        const noteTitle = document.createElement('div') as HTMLDivElement;
        noteTitle.id = 'note-title';
        noteTitle.textContent = note.note_title;

        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.id = 'created-at';
        createdAt.textContent = `${note.created_at}`;

        const noteContent = document.createElement('div') as HTMLDivElement;
        noteContent.id = 'note-content';
        noteContent.textContent = note.note_content;

        return cardNote;
    }

    return { initEventListeners }
}

const noteManager = NoteManager();

const teardownNote = () => {}

document.addEventListener("DOMContentLoaded", noteManager.initEventListeners);
window.addEventListener("beforeunload", teardownNote);