import TableStorage from "./supabase-table";
import type { Note } from "./type-interface";

const tableStorage = TableStorage<Note>('notes');

function NoteForm() {}