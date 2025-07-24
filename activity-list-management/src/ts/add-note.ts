import TableStorage from "./supabase-table";
import type { Note } from "./type-interface";

const tableStorage = TableStorage<Note>('notes');
const controller = new AbortController();
let timeout: number | null = null;

const noteForm = document.getElementById('note-form') as HTMLFormElement;
const notification = document.getElementById('add-note-notification') as HTMLElement;
const noteTitle = document.getElementById('note-title') as HTMLInputElement;
const noteContent = document.getElementById('note-content') as HTMLTextAreaElement;

function NoteFormHnadler() {
    const message = document.createElement('div') as HTMLDivElement;
    const component = document.createElement('div') as HTMLDivElement;

    function initEventListener(): void {
        noteForm.addEventListener('submit', async (event) => await insertNewNote(event), {
            signal: controller.signal
        });
    }

    function createNotification(text: string): void {
        message.textContent = text;
        message.id = 'notification-message';

        component.id = 'component';
        component.appendChild(message);

        notification.appendChild(component);
        timeout = window.setTimeout(() => teardownNotification(), 3000);
    }

    function teardownNotification(): void {
        if (component.parentElement) {
            component.parentElement.removeChild(component);
        }

        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }

        notification.innerHTML = '';
    }

    async function insertNewNote(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedTitle = noteTitle.value.trim();

        if (trimmedTitle === '' || noteContent.value === '') {
            createNotification('Missing required data! Please complete it');
            return;
        }

        try {
            await tableStorage.insert({
                note_title: trimmedTitle,
                note_content: noteContent.value
            });
            noteForm.reset();
        } catch (error: any) {
            createNotification(`Error: ${error.message || error}`);
        }
    }

    return { initEventListener, teardownNotification }
}

const noteFormHnadler = NoteFormHnadler();

function teardownNoteForm(): void {
    controller.abort();
    noteForm.reset();
    noteFormHnadler.teardownNotification();
    tableStorage.teardownStorage();
}


document.addEventListener('DOMContentLoaded', noteFormHnadler.initEventListener);
window.addEventListener('beforeunload', teardownNoteForm);