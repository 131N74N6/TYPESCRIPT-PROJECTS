import DatabaseStorage from "./storage";
import Modal from "./modal";
import Theme from "./theme";

const searchForm = document.getElementById("search-form") as HTMLFormElement;
const searchTitle = document.getElementById("search-title") as HTMLInputElement;
const newestYear = document.getElementById("newest-year") as HTMLInputElement;
const oldestYear = document.getElementById("oldest-year") as HTMLInputElement;

const message = document.getElementById("message") as HTMLElement;
const darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
const bookList = document.getElementById("book-list") as HTMLElement;

interface Book {
    id: string;      
    title: string;    
    author: string;   
    released: number;     
}

class BookManager extends DatabaseStorage<Book> {
    private controller: AbortController = new AbortController();
    private getSelectedId: string | null = null;
    private darkTheme: Theme = new Theme("dark-mode", "dark-mode");
    private bookNotification: Modal = new Modal(message);

    private searchForm = document.getElementById("search-form") as HTMLFormElement;
    private searchTitle = document.getElementById("search-title") as HTMLInputElement;
    private newestYear = document.getElementById("newest-year") as HTMLInputElement;
    private oldestYear = document.getElementById("oldest-year") as HTMLInputElement;

    private message = document.getElementById("message") as HTMLElement;
    private darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
    private bookList = document.getElementById("book-list") as HTMLElement;

    constructor() {
        super("books list"); 
    }

    setEventListeners(): void {
        this.realtimeInit(() => {
            this.showAllBooks();
        });

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest(".delete-all")) this.deleteAllBooks();
            if (target.closest("#reset-form")) this.resetForm();
            if (target.closest("#reset-search")) this.resetSearchForm();
        }, { signal: this.controller.signal });

        newestYear.addEventListener("change", () => {
            oldestYear.checked = false;
            this.showAllBooks();
        }, { signal: this.controller.signal });

        oldestYear.addEventListener("change", () => {
            newestYear.checked = false;
            this.showAllBooks();
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

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
    }, 100);

    private resetSearchForm(): void {
        this.showAllBooks();
        searchForm.reset();
    }
    
    private handleThemeToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
    }

    showAllBooks(): void {
        const bookFragment = document.createDocumentFragment();
        let sortedBooks = this.currentData;

        if (sortedBooks.length > 0) {
            if (newestYear.checked === true) {
                sortedBooks = [...this.currentData].sort((a,b) => b.released - a.released);
            }

            if (oldestYear.checked === true) {
                sortedBooks = [...this.currentData].sort((a,b) => a.released - b.released);
            }
            
            sortedBooks.forEach(book => {
                const component = this.createListBookComponent(book);
                bookFragment.appendChild(component);
            });
        } else {
            const empty = document.createElement("div") as HTMLDivElement;
            empty.className = "empty-list";
            
            const message = document.createElement("div");
            message.className = "message";
            message.textContent = "Daftar buku kosong";

            empty.appendChild(message);
            bookFragment.appendChild(empty);
        }

        bookList.innerHTML = '';
        bookList.appendChild(bookFragment);
    }

    private createListBookComponent(book: Book): HTMLDivElement {
        const bookElement = document.createElement("div");
        bookElement.className = "book-item";

        if (this.getSelectedId ===  book.id) {
            const newTitle = document.createElement("input") as HTMLInputElement;
            newTitle.type = "text";
            newTitle.id = "new-book-title";
            newTitle.value = book.title;
            newTitle.placeholder = "enter new title";

            const newAuthor = document.createElement("input") as HTMLInputElement;
            newAuthor.type = "text";
            newAuthor.id = "new-book-author";
            newAuthor.value = book.author;
            newAuthor.placeholder = "enter new author";

            const newReleasedYear = document.createElement("input") as HTMLInputElement;
            newReleasedYear.type = "text";
            newReleasedYear.id = "new-book-year";
            newReleasedYear.value = book.released.toString();
            newReleasedYear.placeholder = "enter new title";

            const changeBookData = document.createElement("button") as HTMLButtonElement;
            changeBookData.type = "button";
            changeBookData.textContent = "Save";
            changeBookData.className = "change-book-data";
            changeBookData.onclick = async () => {
                const changedBookData = {
                    title: newTitle.value,
                    author: newAuthor.value,
                    released: Number(newReleasedYear.value)
                }
                
                this.getSelectedId = null;
                this.showAllBooks();
                await this.saveChanges(book.id, changedBookData);
            }

            const cancelButton = document.createElement("button") as HTMLButtonElement;
            cancelButton.textContent = "Cancel";
            cancelButton.className = "cancel-button";
            cancelButton.onclick = () => {
                this.getSelectedId = null;
                this.showAllBooks();
            }

            const buttonEditWrap = document.createElement("div") as HTMLDivElement;
            buttonEditWrap.className = "button-edit-wrap";
            buttonEditWrap.append(changeBookData, cancelButton);

            const editForm = document.createElement("div") as HTMLDivElement;
            editForm.className = "edit-field";
            editForm.append(newTitle, newAuthor, newReleasedYear, buttonEditWrap);
            bookElement.appendChild(editForm);
        } else {
            const judul = document.createElement("h3") as HTMLHeadingElement;
            judul.className = "book-title";
            judul.textContent = `Judul : ${book.title}`;

            const penulis = document.createElement("p") as HTMLParagraphElement;
            penulis.className = "book-author";
            penulis.textContent = `Penulis : ${book.author}`;

            const tahun = document.createElement("p") as HTMLParagraphElement;
            tahun.className = "book-published";
            tahun.textContent = `Tahun Terbit : ${book.released}`;

            const buttonWrap = document.createElement("div") as HTMLDivElement;
            buttonWrap.className = "button-wrap";

            const selectButton = document.createElement("button");
            selectButton.type = "button";
            selectButton.className = "select-btn";
            selectButton.textContent = "Select";
            selectButton.onclick = () => {
                this.getSelectedId = book.id;
                this.showAllBooks();
            }

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Delete";
            deleteButton.onclick = async () => await this.deleteBook(book.id);

            buttonWrap.append(selectButton, deleteButton);
            bookElement.append(judul, penulis, tahun, buttonWrap);
        }
        
        return bookElement;
    }

    private async deleteBook(id: string): Promise<void> {
        await this.deleteSelected(id);
        
        if (this.getSelectedId === id) this.resetForm();
        
        this.showAllBooks();
    }

    async deleteAllBooks(): Promise<void> {
        const data = this.currentData;
        if (data.length > 0) {
            await this.deleteAllData();
            bookList.replaceChildren();
            this.resetForm();
        } else {
            this.bookNotification.createModalComponent("Tidak ada buku yang ditambahkan");
            this.bookNotification.showModal();
        }
        this.showAllBooks();
    }

    private handleSearch(event: SubmitEvent): void {
        event.preventDefault();
        const items = this.currentData;
        const searched = searchTitle.value.toLowerCase();
    
        if (searched.trim() === "") {
            this.bookNotification.createModalComponent("Masukkan judul buku yang akan dicari");
            this.bookNotification.showModal();
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

    cleanUp(): void {
        this.controller.abort();
    }
}

const book: BookManager = new BookManager();

function initBookManager(): void {
    book.setEventListeners();
}

function cleanupBookManager(): void {
    book.cleanUp();
}

document.addEventListener("DOMContentLoaded", initBookManager);
window.addEventListener("beforeunload", cleanupBookManager);