import DataStorage from "./storage.js";
import Book from './index.js';

class BookManager extends DataStorage<Book> {
    bookForm: HTMLFormElement;
    title: HTMLInputElement;
    author: HTMLInputElement;
    year: HTMLInputElement;
    submitBtn: HTMLButtonElement;
    searchForm: HTMLFormElement;
    bookList: HTMLElement;
    message: HTMLElement;
    messageContent: HTMLElement;
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
        this.setEventListeners();
    }

    private setEventListeners(): void {
        this.bookList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const userId = Number(target.closest('.user-list')?.getAttribute('data-id'));
            
            if (target.classList.contains('delete-btn')) this.deleteBook(userId); 
            if (target.classList.contains('edit-btn')) this.selectedItem(userId);
        });
    }

    showAllBooks(): void {
        const bookFragment = document.createDocumentFragment();

        this.getAll().forEach(book => {
            const component = this.createListBookComponent(book);
            bookFragment.appendChild(component);
        });

        this.bookList.innerHTML = '';
        this.bookList.appendChild(bookFragment);
    }

    createListBookComponent(book: Book): HTMLDivElement {
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
        return bookElement;
    }

    private selectedItem(id: number): void {
        this.selectedId = id;

        const bookInfo = this.getAll().find(book => book.id === this.selectedId);

        if (!bookInfo) return;
        
        this.title.value = bookInfo.title;
        this.author.value = bookInfo.author;
        this.year.value = bookInfo.year;
        
        this.submitBtn.textContent = "Edit Buku";
    }

    editBook(id: number, book: Book): void {
        const item = this.getAll();
        const index = item.findIndex(it => it.id === id);

        item[index] = book;
        this.saveToStorage(item);
    }

    private deleteBook(id: number): void {
        const element = this.bookList.querySelector(`[book-id="${id}"]`) as HTMLElement;
        element.remove();
        this.delete(id);
    }

    deleteAllBooks(): void {
        const data = this.getAll();
        if (data.length > 0) {
            this.deleteAll();
            this.showAllBooks();
        } else {
            this.showModal("Tidak ada buku yang ditambahkan");
        }
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
        this.selectedId = null;
        this.bookForm.style.display = "flex";
        this.searchForm.style.display = "none";
        this.searchForm.reset();
        this.showAllBooks();
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