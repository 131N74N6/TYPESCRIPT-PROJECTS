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
        cardNote.className = 'border-[1.9px] p-[0.5rem] rounded-[0.5rem] text-[#FA198B] text-[0.9rem] bg-[#6B0F1A]';

        const noteTitle = document.createElement('div') as HTMLDivElement;
        noteTitle.id = 'note-title';
        noteTitle.textContent = note.note_title;
        noteTitle.className = 'font-[580] text-[1.3rem] capitalize';

        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.id = 'created-at';
        createdAt.textContent = `${note.created_at}`;

        const noteContent = document.createElement('div') as HTMLDivElement;
        noteContent.id = 'note-content';
        noteContent.textContent = note.note_content;

        const viewButton = document.createElement('button') as HTMLButtonElement;
        viewButton.type = 'button';
        viewButton.id = 'view-button';
        viewButton.className = 'bg-[#31081F] p-[0.4rem] text-[#FA198B] cursor-pointer text-[0.9rem] rounded-[0.4rem]';
        viewButton.textContent = 'View';
        viewButton.onclick = () => window.location.href = `detail-notes.html?id=${note.id}`;

        const removeButton = document.createElement('button') as HTMLButtonElement;
        removeButton.id = 'remove-button';
        removeButton.type = 'button';
        removeButton.textContent = 'Delete';
        removeButton.className = 'bg-[#31081F] p-[0.4rem] text-[#FA198B] cursor-pointer text-[0.9rem] rounded-[0.4rem]';
        removeButton.onclick = async () => await tableStorage.deleteSelectedData(note.id);

        const burronWrap = document.createElement('div') as HTMLDivElement;
        burronWrap.id = 'button-wrap';
        burronWrap.className = 'flex gap-[0.5rem] mt-[0.5rem]';
        burronWrap.append(viewButton, removeButton);

        cardNote.append(noteTitle, noteContent, burronWrap);
        return cardNote;
    }

    return { initEventListeners }
}

const noteManager = NoteManager();

const teardownNote = () => {
    tableStorage.teardownStorage();
}

document.addEventListener("DOMContentLoaded", noteManager.initEventListeners);
window.addEventListener("beforeunload", teardownNote);