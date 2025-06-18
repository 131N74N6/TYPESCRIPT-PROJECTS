import DatabaseStorage from "./storage";
import Modal from "./modal";
import Theme from "./theme";

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
    private bookNotification: Modal;

    private searchForm = document.getElementById("search-form") as HTMLFormElement;
    private searchTitle = document.getElementById("search-title") as HTMLInputElement;
    private newestYear = document.getElementById("newest-year") as HTMLInputElement;
    private oldestYear = document.getElementById("oldest-year") as HTMLInputElement;
    private message = document.getElementById("message") as HTMLElement;

    private darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
    private bookList = document.getElementById("book-list") as HTMLElement;

    constructor() {
        super("books_list");
        this.bookNotification = new Modal(this.message);
    }

    setEventListeners(): void {
        this.realtimeInit(() => {
            this.showAllBooks();
        });

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest(".delete-all")) this.deleteAllBooks();
            else if (target.closest("#reset-form")) this.searchForm.reset();
            else if (target.closest("#reset-search")) this.resetSearchForm();
        }, { signal: this.controller.signal });

        this.newestYear.addEventListener("change", () => {
            this.oldestYear.checked = false;
            this.showAllBooks();
        }, { signal: this.controller.signal });

        this.oldestYear.addEventListener("change", () => {
            this.newestYear.checked = false;
            this.showAllBooks();
        }, { signal: this.controller.signal });

        this.searchForm.addEventListener("submit", (event) => this.handleSearch(event), { 
            signal: this.controller.signal 
        });

        this.darkToggle.addEventListener("change", (event) => this.handleThemeToggle(event), { 
            signal: this.controller.signal 
        });
    }

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
    }, 100);

    private resetSearchForm(): void {
        this.showAllBooks();
        this.searchForm.reset();
    }
    
    private handleThemeToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
    }

    showAllBooks(): void {
        const bookFragment = document.createDocumentFragment();
        const getAllBooks = Array.from(this.currentData.values());
        let sortedBooks = getAllBooks;
        this.bookList.innerHTML = '';

        if (sortedBooks.length > 0) {
            if (this.newestYear.checked === true) {
                sortedBooks = [...getAllBooks].sort((a,b) => b.released - a.released);
            } else if (this.oldestYear.checked === true) {
                sortedBooks = [...getAllBooks].sort((a,b) => a.released - b.released);
            } else {
                sortedBooks = getAllBooks;
            }
            
            sortedBooks.forEach(book => {
                const component = this.createListBookComponent(book);
                bookFragment.appendChild(component);
            });
            
            this.bookList.appendChild(bookFragment);
        } else {
            this.bookList.textContent = "No books";
        }
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
                try {
                    this.getSelectedId = null;
                    this.showAllBooks();
                    
                    await this.changeSelectedData(book.id, {
                        title: newTitle.value,
                        author: newAuthor.value,
                        released: Number(newReleasedYear.value)
                    });
                } catch (error) {
                    this.bookNotification.createModalComponent(`Failed to change book: ${error}`);
                    this.bookNotification.showModal();
                }
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
        try {
            await this.deleteSelectedData(id);
            if (this.getSelectedId === id) this.searchForm.reset();           
        } catch (error) {
            this.bookNotification.createModalComponent(`Failed to delete book: ${error}`);
            this.bookNotification.showModal();
        }
    }

    async deleteAllBooks(): Promise<void> {
        const data = Array.from(this.currentData.values());

        try {
            if (data.length > 0) {
                await this.deleteAllData();
                this.searchForm.reset();
                this.bookList.innerHTML = '';
                this.bookList.textContent = 'No Books';
            } else {
                this.bookNotification.createModalComponent("Please add one book");
                this.bookNotification.showModal();
            }     
        } catch (error) {
            this.bookNotification.createModalComponent(`Failed to delete all books: ${error}`);
            this.bookNotification.showModal();
        }
    }

    private handleSearch(event: SubmitEvent): void {
        event.preventDefault();
        const items = Array.from(this.currentData.values());
        const searched = this.searchTitle.value.toLowerCase();
    
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

        this.bookList.innerHTML = '';
        this.bookList.appendChild(filteredBooks);
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