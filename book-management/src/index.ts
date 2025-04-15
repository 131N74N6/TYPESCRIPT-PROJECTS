interface Book {
    id: string;      
    title: string;    
    author: string;   
    year: number;     
}

class DataStorage<T extends { id: string }> {
    private key: string;

    // Constructor: menerima key untuk localStorage
    constructor(storageKey: string) {
        this.key = storageKey;
    }

    private saveToStorage(data: T[]): void {
        localStorage.setItem(this.key, JSON.stringify(data));
    }

    private getFromStorage(): T[] {
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : [];
    }

    private deleteStorage(): void {
        localStorage.removeItem(this.key);
    }

    add(item: T): void {
        const items = this.getFromStorage();
        items.push(item);
        this.saveToStorage(items);
    }

    delete(id: string): void {
        const items = this.getFromStorage();
        const index = items.findIndex(item => item.id === id);
        items.splice(index, 1);
        this.saveToStorage(items);
    }

    deleteAll(): void {
        this.deleteStorage();
    }

    getAll(): T[] {
        return this.getFromStorage();
    }
}

class BookManager extends DataStorage<Book> {
    private domMap = new Map<string, HTMLElement>();
    private currentSearchResults: Book[] | null = null;

    isEditing: boolean = false;
    selectedId: string | null = null;

    constructor() {
        super("BOOKS_DATA"); 
    }

    addBookToDOM(book: Book): void {
        const bookList = document.getElementById("book-list")!;
        this.currentSearchResults = null;
        
        const bookElement = document.createElement("div");
        bookElement.className = "book-item";
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
        if (editBtn) editBtn.addEventListener("click", () => {
            this.isEditing = true;
            this.selectedId = book.id;
            
            (document.getElementById("title") as HTMLInputElement).value = book.title;
            (document.getElementById("author") as HTMLInputElement).value = book.author;
            (document.getElementById("year") as HTMLInputElement).value = book.year.toString();
            
            (document.querySelector(".submit-btn") as HTMLElement).textContent = "Update Buku";
        });

        bookList.appendChild(bookElement);
    }

    editBook(id: string, book: Book): void {
        const item = this.getAll();
        const index = item.findIndex(it => it.id === id);

        if (index !== 1) {
            item[index] = book;
            const getSign = this.domMap.get(id);

            if (getSign) {
                getSign.querySelector('h3')!.textContent = book.title;
                getSign.querySelectorAll('p')[0].textContent = `Penulis: ${book.author}`;
                getSign.querySelectorAll('p')[1].textContent = `Tahun: ${book.year}`;
            }
        }
    }

    deleteBook(id: string): void {
        const element = this.domMap.get(id);
        if(element) {
            element.remove();    // Hapus dari DOM
            this.domMap.delete(id); // Hapus dari Map
            this.delete(id);
        }
    }

    deleteAllBooks(): void {
        const item = this.getAll();
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
        const message = document.getElementById("message") as HTMLElement;
        const messageContent = document.getElementById("text") as HTMLElement;
        const closeModal = document.querySelector(".close-modal") as HTMLElement;

        messageContent.textContent = text;
        message.style.display = "block";

        if (closeModal) closeModal.addEventListener("click", () => this.closeModal());
    }

    closeModal(): void {
        const message = document.getElementById("message") as HTMLElement;
        let searchTitle = document.getElementById("search-title") as HTMLInputElement;

        searchTitle.value = "";
        message.style.display = "none";
    }

    searchMode(): void {
        const bookForm = document.getElementById("book-form") as HTMLFormElement;
        const searchForm = document.getElementById("search-form") as HTMLFormElement;
        bookForm.style.display = "none";
        searchForm.style.display = "flex";
    }

    closeSearchMode(): void {
        const bookForm = document.getElementById("book-form") as HTMLFormElement;
        const searchForm = document.getElementById("search-form") as HTMLFormElement;
        bookForm.style.display = "flex";
        searchForm.style.display = "none";
        this.backToDefaults();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const bookManager = new BookManager();

    const bookForm = document.getElementById("book-form") as HTMLFormElement;
    const searchForm = document.getElementById("search-form") as HTMLFormElement;

    const submitBtn = document.querySelector(".submit-btn") as HTMLElement;
    const searchMode = document.querySelector(".search-mode") as HTMLElement;
    const closeSearch = document.querySelector(".close-search") as HTMLElement;

    // Tampilkan buku yang tersimpan
    bookManager.initialRender();

    const deleteAllBooks = document.querySelector(".delete-all") as HTMLElement;
    if (deleteAllBooks) deleteAllBooks.addEventListener("click", () => bookManager.deleteAllBooks());

    if (searchMode) searchMode.addEventListener("click", () => bookManager.searchMode());
    if (closeSearch) closeSearch.addEventListener("click", () => bookManager.closeSearchMode());

    searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const searchTitle = (document.getElementById("search-title") as HTMLInputElement).value;

        if (searchTitle.trim() === "") {
            bookManager.showModal("Masukkan judul buku yang akan dicari");
            return;
        }

        const items = bookManager.getAll();
        const searched = items.filter((search) => search.title.toLowerCase().includes(searchTitle.toLowerCase()));
        bookManager.showSearchResult(searched);
    });

    // Handle form submit
    bookForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = (document.getElementById("title") as HTMLInputElement).value;
        const author = (document.getElementById("author") as HTMLInputElement).value;
        const year = parseInt((document.getElementById("year") as HTMLInputElement).value);

        const items = bookManager.getAll();
        const isExist = items.some(item => item.title.toLowerCase() === title.toLowerCase());

        if (title.trim() ==="" || author.trim() === "" || year === 0 ) {
            bookManager.showModal("Lengkapi data terlebih dahulu!");
            return;
        }


        // Buat objek buku baru
        if(bookManager.isEditing && bookManager.selectedId) { 
            // Mode edit
            const updatedBook: Book = {
                id: bookManager.selectedId,
                title,
                author,
                year
            };
            
            bookManager.editBook(bookManager.selectedId, updatedBook);
            
            // Reset mode edit
            bookManager.isEditing = false;
            bookManager.selectedId = null;
            submitBtn.textContent = "Tambah Buku"; // 🆕 Kembalikan teks tombol
        } else { 
            // Mode tambah
            if (isExist) {
                bookManager.showModal("Buku sudah ada/terdaftar");
                return;
            }

            const newBook: Book = {
                id: Date.now().toString(),
                title,
                author,
                year
            };
            
            bookManager.add(newBook);
            bookManager.addBookToDOM(newBook);
        }

        bookForm.reset();
    });
});
