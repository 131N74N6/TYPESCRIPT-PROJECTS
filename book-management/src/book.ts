import DataStorage from "./storage.js";
import Book from './index.js';

class BookManager extends DataStorage<Book> {
    private domMap = new Map<number, HTMLElement>();

    bookForm: HTMLFormElement;
    title: HTMLInputElement;
    author: HTMLInputElement;
    year: HTMLInputElement;
    submitBtn: HTMLButtonElement;
    searchForm: HTMLFormElement;
    bookList: HTMLElement;
    message: HTMLElement;
    messageContent: HTMLElement;

    currentSearchResults: Book[] | null = null;
    selectedId: number | null = null;

    constructor(
        bookForm: HTMLFormElement, title: HTMLInputElement, author: HTMLInputElement, year: HTMLInputElement, 
        submitBtn: HTMLButtonElement, searchForm: HTMLFormElement, bookList: HTMLElement, message: HTMLElement, 
        messageContent: HTMLElement
    ) {
        super("BOOKS_DATA"); 
        this.bookForm = bookForm;
        this.title = title;
        this.author = author;
        this.year = year;
        this.submitBtn = submitBtn;
        this.searchForm = searchForm;
        this.bookList = bookList;
        this.message = message;
        this.messageContent = messageContent;
    }

    addBookToDOM(book: Book): void {
        this.currentSearchResults = null;
        const bookElement = document.createElement("div");
        bookElement.className = "book-item";
        bookElement.setAttribute("book-id", String(book.id));
        bookElement.innerHTML = `
            <div class="detail-info">
                <h3>${book.title}</h3>
                <p>Penulis: ${book.author}</p>
                <p>Tahun: ${book.year}</p>
            </div>
            <div class="control">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Hapus</button>
            </div>
        `;

        this.domMap.set(book.id, bookElement);

        const deleteBtn = bookElement.querySelector(".delete-btn") as HTMLElement;
        const editBtn = bookElement.querySelector(".edit-btn") as HTMLElement;
        
        if (deleteBtn) deleteBtn.addEventListener("click", () => this.deleteBook(book.id));
        if (editBtn) editBtn.addEventListener("click", () => this.selectedItem(book.id));

        this.bookList.appendChild(bookElement);
    }

    selectedItem(id: number): void {
        this.selectedId = id;

        const bookInfo = this.getAll().find(book => book.id === id);

        if (!bookInfo) return;
        
        this.title.value = bookInfo.title;
        this.author.value = bookInfo.author;
        this.year.value = bookInfo.year.toString();
        
        this.submitBtn.textContent = "Edit Buku";
    }

    editBook(id: number, book: Book): void {
        const item = this.getAll();
        const index = item.findIndex(it => it.id === id);

        if (index !== -1) {
            item[index] = book;
            const getSign = this.domMap.get(id);

            if (getSign) {
                getSign.querySelector('h3')!.textContent = book.title;
                getSign.querySelectorAll('p')[0].textContent = `Penulis: ${book.author}`;
                getSign.querySelectorAll('p')[1].textContent = `Tahun: ${book.year}`;
            }
        }
    }

    deleteBook(id: number): void {
        const element = this.domMap.get(id);
        if(element) {
            element.remove();    // Hapus dari DOM
            this.domMap.delete(id); // Hapus dari Map
            this.delete(id);
        }
    }

    deleteAllBooks(): void {
        this.deleteAll();
        this.domMap.forEach(item => item.remove());
        this.domMap.clear();
    }

    // Tampilkan semua buku saat pertama kali load
    initialRender(): void {
        this.getAll().forEach(book => this.addBookToDOM(book));
    }

    showSearchResult(book: Book[]): void {
        this.currentSearchResults = book;
        
        const existingIds = new Set(book.map(b => b.id));
        
        this.domMap.forEach((element, id) => {
            if (!existingIds.has(id)) {
                element.remove();
                this.domMap.delete(id);
            }
        });

        book.forEach(bk => {
            if (!this.domMap.has(bk.id)) {
                this.addBookToDOM(bk);
            }
        });
    }

    backToDefaults(): void {
        this.currentSearchResults = null;
        const allBooks = this.getAll();
        
        if (this.domMap.size !== allBooks.length) {
            this.domMap.forEach(element => element.remove());
            this.domMap.clear();
            this.initialRender();
        } else {
            allBooks.forEach(book => {
                const element = this.domMap.get(book.id)!;
                element.querySelector('h3')!.textContent = book.title;
                element.querySelectorAll('p')[0].textContent = `Penulis: ${book.author}`;
                element.querySelectorAll('p')[1].textContent = `Tahun: ${book.year}`;
            });
        }
    }

    showModal(text: string): void {
        this.messageContent.textContent = text;
        this.message.style.display = "block";
    }

    closeModal(): void {
        this.message.style.display = "none";
    }

    searchMode(): void {
        this.bookForm.style.display = "none";
        this.searchForm.style.display = "flex";
        this.bookForm.reset();
    }

    closeSearchMode(): void {
        this.bookForm.style.display = "flex";
        this.searchForm.style.display = "none";
        this.searchForm.reset();
        this.backToDefaults();
    }

    ascSort(): Book[] {
        const allBooks = this.getAll();
        return allBooks.toSorted();
    }

    dscSort(): Book[] {
        const allBooks = this.getAll();
        const sort1 = allBooks.toSorted();
        return sort1.reverse();
    }
}

export default BookManager;