import DataStorage from "./storage.js";
import Modal from "./modal.js";
import Theme from "./theme.js";

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

class BookManager extends DataStorage<Book> {
    private controller: AbortController;
    protected darkTheme: Theme = new Theme("dark-mode", "dark-mode");

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
        this.darkTheme.changeSign(isActived ? "☀️" : "🌙");
    }, 100);

    constructor() {
        super("BOOKS_DATA"); 
        this.controller = new AbortController();
        this.setEventListeners();
        darkToggle.checked = this.darkTheme.isActive;
    }

    private setEventListeners(): void {
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const getAllBooks = Array.from(document.querySelectorAll(".book-item"));

            const selectButton = target.closest(".select-btn");
            const deleteButton = target.closest(".delete-btn");

            const getComponentToSelect = selectButton?.closest(".book-item");
            const getComponentToDelete = deleteButton?.closest(".book-item");

            const getSelectedIndex = getAllBooks.indexOf(getComponentToSelect as Element);
            const getIndexToRemove = getAllBooks.indexOf(getComponentToDelete as Element);

            if (getSelectedIndex > -1) {
                const bookData = this.getAll()[getSelectedIndex];
                this.selectedItem(bookData.id);
            }
            if (getIndexToRemove > -1) {
                const bookData = this.getAll()[getIndexToRemove];
                this.deleteBook(bookData.id);
            }
            if (target.closest(".search-mode")) bookManager.searchMode();
            if (target.closest(".close-search")) bookManager.closeSearchMode();
            if (target.closest(".delete-all")) bookManager.deleteAllBooks();
        }, { signal: this.controller.signal });
            
        bookForm.addEventListener("submit", (event) => this.handleForm(event), { 
            signal: this.controller.signal 
        });

        searchForm.addEventListener("submit", (event) => this.handleSearch(event), { 
            signal: this.controller.signal 
        });

        darkToggle.addEventListener("change", (event) => this.handleThemeToggle(event), { 
            signal: this.controller.signal 
        });
    }

    private handleForm(event: SubmitEvent): void {
        event.preventDefault();
        const items = this.getAll();
        const isExist = items.some(item => item.title.toLowerCase() === title.value.toLowerCase());
        const isInEditMode = !!this.getSelectedId();
    
        if (title.value.trim() === "" || author.value.trim() === "" || year.value.trim() === "") {
            new Modal("Lengkapi data terlebih dahulu!");
            return;
        }

        const newBook: Partial<Book> = {
            title: title.value,
            author: author.value,
            year: year.value
        }
    
        if (isInEditMode) { 
            this.changeSelectedData(this.getSelectedId() as number, newBook);
        } else { 
            if (isExist) {
                new Modal("Buku sudah ada/terdaftar");
                return;
            }
            this.addData(newBook as Omit<Book, 'id'>);
            new Modal("Buku berhasil ditambahkan!");
        }

        this.resetForm();
        this.showAllBooks();
    }

    private resetForm(): void {
        this.setSelectedId(null);
        submitBtn.textContent = "Tambah Buku"; 
        bookForm.reset();
    }
    
    private handleThemeToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
    }

    showAllBooks(): void {
        const bookFragment = document.createDocumentFragment();

        this.getAll().forEach(book => {
            const component = this.createListBookComponent(book);
            bookFragment.appendChild(component);
        });

        bookList.innerHTML = '';
        bookList.appendChild(bookFragment);
    }

    private createListBookComponent(book: Book): HTMLDivElement {
        const bookElement = document.createElement("div");
        bookElement.className = "book-item";

        const detailInfo = document.createElement("div") as HTMLDivElement;
        detailInfo.className = "detail-info";

        const judul = document.createElement("h3") as HTMLHeadingElement;
        judul.textContent = `Judul : ${book.title}`;

        const penulis = document.createElement("p") as HTMLParagraphElement;
        penulis.textContent = `Penulis : ${book.author}`;

        const tahun = document.createElement("p") as HTMLParagraphElement;
        tahun.textContent = `Tahun Terbit : ${book.year}`;

        detailInfo.append(judul, penulis, tahun);

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const selectBtn = document.createElement("button");
        selectBtn.type = "button";
        selectBtn.className = "select-btn";
        selectBtn.textContent = "Select";

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "Delete";

        buttonWrap.append(selectBtn, deleteBtn);
        bookElement.append(detailInfo, buttonWrap);
        
        return bookElement;
    }

    private selectedItem(id: number): void {
        this.setSelectedId(id);

        const bookInfo = this.getAll().find(book => book.id === id);

        if (!bookInfo) return;
        
        title.value = bookInfo.title;
        author.value = bookInfo.author;
        year.value = bookInfo.year;
        
        submitBtn.textContent = "Edit Buku";
    }

    private deleteBook(id: number): void {
        this.delete(id);
        
        if (this.getSelectedId() === id) this.resetForm();
        
        this.showAllBooks();
    }

    deleteAllBooks(): void {
        const data = this.getAll();
        if (data.length > 0) {
            this.deleteAll();
            bookList.replaceChildren();
        } else {
            new Modal("Tidak ada buku yang ditambahkan");
        }
    }

    private handleSearch(event: SubmitEvent): void {
        event.preventDefault();
        const items = this.getAll();
        const searched = searchTitle.value.toLowerCase();
    
        if (searched.trim() === "") {
            new Modal("Masukkan judul buku yang akan dicari");
            return;
        }
    
        const filterBooks = items.filter((search) => search.title.toLowerCase().includes(searched));
        this.showSearchResult(filterBooks);
    }

    showSearchResult(books: Book[]): void {
        const filteredBooks = document.createDocumentFragment();

        books.forEach(book => {
            const searchedComponents = this.createListBookComponent(book);
            filteredBooks.appendChild(searchedComponents);
        });

        bookList.innerHTML = '';
        bookList.appendChild(filteredBooks);
    }

    searchMode(): void {
        this.setSelectedId(null);
        bookForm.style.display = "none";
        searchForm.style.display = "flex";
        bookForm.reset();
    }

    closeSearchMode(): void {
        this.setSelectedId(null);
        bookForm.style.display = "flex";
        searchForm.style.display = "none";
        searchForm.reset();
        this.showAllBooks();
    }

    cleanUp(): void {
        this.controller.abort();
        this.controller = new AbortController();
        this.setEventListeners();
    }
}

let bookManager : BookManager;

function setupService(): void {
    bookManager = new BookManager();
    bookManager.showAllBooks();
}

function init(): void {
    setupService();
}

function cleanUp(): void {
    bookManager.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", cleanUp);