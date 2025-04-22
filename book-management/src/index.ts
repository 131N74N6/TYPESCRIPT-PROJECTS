import BookManager from "./book.js";

interface Book {
    id: number;      
    title: string;    
    author: string;   
    year: string;     
}

const bookForm = document.getElementById("book-form") as HTMLFormElement;
const searchForm = document.getElementById("search-form") as HTMLFormElement;

const title = document.getElementById("title") as HTMLInputElement;
const author = document.getElementById("author") as HTMLInputElement;
const year = document.getElementById("year") as HTMLInputElement;
const searchTitle = (document.getElementById("search-title") as HTMLInputElement).value;

const submitBtn = document.querySelector(".submit-btn") as HTMLButtonElement;
const bookList = document.getElementById("book-list") as HTMLElement;

const message = document.getElementById("message") as HTMLElement;
const messageContent = document.getElementById("text") as HTMLElement;

let bookManager : BookManager;
let abortController : AbortController;

function setupService(): void {
    bookManager = new BookManager(bookForm, title, author, year, submitBtn, searchForm, bookList, message, messageContent);
}

function setupDataAndTheme(): void {
    bookManager.initialRender();
}

function setupEventListener(): void {
    abortController = new AbortController();
    const { signal } = abortController;

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".search-mode")) bookManager.searchMode();
        if (target.closest(".close-search")) bookManager.closeSearchMode();
        if (target.closest(".delete-all")) bookManager.closeSearchMode();
        if (target.closest(".close-modal")) bookManager.closeModal();
        if (target.closest(".asc-sort")) bookManager.ascSort();
        if (target.closest(".dsc-sort")) bookManager.dscSort();
    }, { signal });

    bookForm.addEventListener("submit", handleForm, { signal });
    searchForm.addEventListener("submit", handleSearch, { signal });
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
        bookManager.addBookToDOM(newBook);
    }

    bookForm.reset();
}

function handleSearch(event: SubmitEvent): void {
    event.preventDefault();

    if (searchTitle.trim() === "") {
        bookManager.showModal("Masukkan judul buku yang akan dicari");
        return;
    }

    const items = bookManager.getAll();
    const searched = items.filter((search) => search.title.toLowerCase().includes(searchTitle.toLowerCase()));
    bookManager.showSearchResult(searched);
}

function init(): void {
    setupService();
    setupDataAndTheme();
    setupEventListener();
}

function cleanUp(): void {
    abortController?.abort();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);

export default Book;