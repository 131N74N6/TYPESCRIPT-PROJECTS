import BookManager from "./book.js";
import { debounce, Theme } from "./theme.js";

interface Book {
    id: number;      
    title: string;    
    author: string;   
    year: string;     
}

const bookForm = document.getElementById("book-form") as HTMLFormElement;
const searchForm = document.getElementById("search-form") as HTMLFormElement;

const darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
const title = document.getElementById("title") as HTMLInputElement;
const author = document.getElementById("author") as HTMLInputElement;
const year = document.getElementById("year") as HTMLInputElement;
const searchTitle = document.getElementById("search-title") as HTMLInputElement;

const submitBtn = document.querySelector(".submit-btn") as HTMLButtonElement;
const bookList = document.getElementById("book-list") as HTMLElement;

const message = document.getElementById("message") as HTMLElement;
const messageContent = document.getElementById("text") as HTMLElement;

let bookManager : BookManager;
let darkTheme : Theme;
let abortController : AbortController;

function setupService(): void {
    bookManager = new BookManager(
        bookForm, title, author, year, submitBtn, searchForm, bookList, message, messageContent
    );
    darkTheme = new Theme("dark-mode", "dark-mode");
}

function setupDataAndTheme(): void {
    bookManager.showAllBooks();
    darkToggle.checked = darkTheme.isActive;
}

function setupEventListener(): void {
    abortController = new AbortController();
    const { signal } = abortController;

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".search-mode")) bookManager.searchMode();
        if (target.closest(".close-search")) bookManager.closeSearchMode();
        if (target.closest(".delete-all")) bookManager.deleteAllBooks();
        if (target.closest(".close-modal")) bookManager.closeModal();
    }, { signal });

    bookForm.addEventListener("submit", handleForm, { signal });
    searchForm.addEventListener("submit", handleSearch, { signal });
    darkToggle.addEventListener("change", handleThemeToggle, { signal });
}

const handleThemeChange = debounce((isChecked: boolean): void => {
    darkTheme.changeTheme(isChecked ? 'active' : 'inactive');
    darkTheme.changeSign(isChecked ? 'Light Mode' : 'Dark Mode');
}, 100);

const handleThemeToggle = (event: Event): void => {
    handleThemeChange((event.target as HTMLInputElement).checked);
}

function handleForm(event: SubmitEvent): void {
    event.preventDefault();

    const items = bookManager.getAll();
    const isExist = items.some(item => item.title.toLowerCase() === title.value.toLowerCase());

    if (title.value.trim() === "" || author.value.trim() === "" || year.value.trim() === "") {
        bookManager.showModal("Lengkapi data terlebih dahulu!");
        return;
    }

    if (bookManager.selectedId) { 
        const updatedBook: Book = {
            id: bookManager.selectedId,
            title: title.value,
            author: author.value,
            year: year.value
        };

        const selected = document.querySelector(`[book-id="${bookManager.selectedId}"]`) as HTMLElement;

        if (selected) {
            selected.innerHTML = bookManager.createListBookComponent(updatedBook).innerHTML;
        }
        
        bookManager.editBook(bookManager.selectedId, updatedBook);
        
        // Reset mode edit
        bookManager.selectedId = null;
        submitBtn.textContent = "Tambah Buku"; // 🆕 Kembalikan teks tombol
    } else { 
        // Mode tambah
        if (isExist) {
            bookManager.showModal("Buku sudah ada/terdaftar");
            return;
        }

        const newBook: Book = {
            id: Date.now(),
            title: title.value,
            author: author.value,
            year: year.value
        };
        
        bookManager.add(newBook);
        bookList.appendChild(bookManager.createListBookComponent(newBook));
        bookManager.showModal("Buku berhasil ditambahkan!");
    }

    bookForm.reset();
}

function handleSearch(event: SubmitEvent): void {
    event.preventDefault();
    const items = bookManager.getAll();
    const searched = searchTitle.value.toLowerCase();

    if (searched.trim() === "") {
        bookManager.showModal("Masukkan judul buku yang akan dicari");
        return;
    }

    const filterBooks = items.filter((search) => search.title.toLowerCase().includes(searched));
    bookManager.showSearchResult(filterBooks);
}

function init(): void {
    setupService();
    setupDataAndTheme();
    setupEventListener();
}

function cleanUp(): void {
    abortController?.abort();
    bookManager.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);

export default Book;