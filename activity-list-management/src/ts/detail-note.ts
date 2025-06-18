import TableStorage from "./supabase-table";
import type { Note } from "./type-interface";

const urlParams = new URLSearchParams(window.location.search);
const getData = urlParams.get('id');
const tableStorage = TableStorage<Note>('notes');

const controller = new AbortController();
let timeout: number | null = null;

const newNoteForm = document.getElementById('new-note-form') as HTMLFormElement;
const notification = document.getElementById('add-note-notification') as HTMLElement;
const newNoteTitle = document.getElementById('new-note-title') as HTMLInputElement;
const newNoteContent = document.getElementById('new-note-content') as HTMLTextAreaElement;

const DetailNote = () => {
    if (!getData) return;
    const getNote = tableStorage.currentData.get(getData);
    if (!getNote) return;

    const initEventListener = () => {
        showNoteDetail();
    }

    const showNoteDetail = () => {
        newNoteTitle.value = getNote.note_title;
        newNoteContent.value = getNote.note_content;
    }

    return { initEventListener }
}

const detailNote = DetailNote();

document.addEventListener('DOMContentLoaded', detailNote?.initEventListener())