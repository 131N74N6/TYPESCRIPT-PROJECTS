import TableStorage from "./supabase-table";
import type { Note } from "./type-interface";

const urlParams = new URLSearchParams(window.location.search);
const getNoteId = urlParams.get('id');
const tableStorage = TableStorage<Note>('notes');

const controller = new AbortController();
let timeout: number | null = null;

const newNoteForm = document.getElementById('new-note-form') as HTMLFormElement;
const notification = document.getElementById('add-note-notification') as HTMLElement;
const newNoteTitle = document.getElementById('new-note-title') as HTMLInputElement;
const newNoteContent = document.getElementById('new-note-content') as HTMLTextAreaElement;

const DetailNote = () => {
    const component = document.createElement('div') as HTMLDivElement;
    component.className = 'bg-[#0E0004] p-[0.5rem] text-[1rem] rounded-[0.5rem]';
    const text = document.createElement('div') as HTMLDivElement;
    text.className = 'text-[#B91372] font-[500]';

    if (!getNoteId) {
        return {
            initEventListener: (): void => {
                window.location.href = 'note.html';
                setTimeout(() => window.location.href = 'note.html', 2000);
            }
        }
    }

    const createNotification = (message: string): void => {
        text.textContent = message;
        component.id = 'component';
        component.appendChild(text);
        notification.appendChild(component);
        timeout = window.setTimeout(() => teardownNotification(), 3000);
    }

    const teardownNotification = (): void => {
        if (component.parentElement) {
            component.parentElement.removeChild(component);
        }
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        notification.innerHTML = '';
    }

    const showSelectedNote = async (): Promise<void> => {
        const getDetail = await tableStorage.selectData(getNoteId);
        try {            
            newNoteTitle.value = getDetail.note_title;
            newNoteContent.value = getDetail.note_content;
        } catch (error: any) {
            createNotification(`Error: ${error.message || error}`);
        }
    }

    const initEventListener = async (): Promise<void> => {
        await showSelectedNote();
        newNoteForm.addEventListener('submit', async () => {
            try {
                tableStorage.changeSelectedData(getNoteId, {
                    note_title: newNoteTitle.value,
                    note_content: newNoteContent.value
                });
                window.location.href = 'note.html';
            } catch (error: any) {
                createNotification(`Error: ${error.message || error}`);
            }
        }, { signal: controller.signal });
    }

    return { initEventListener }
}

const detailNote = DetailNote();

document.addEventListener('DOMContentLoaded', detailNote.initEventListener);
window.addEventListener('beforeunload', controller.abort);