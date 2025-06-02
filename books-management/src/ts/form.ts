import DatabaseStorage from "./storage";
import Modal from "./modal";
import Theme from "./theme";

interface Book {
    id: string;   
    title: string;   
    author: string; 
    released: number;
}

class BookForm extends DatabaseStorage<Book> {
    private bookForm = document.getElementById("book-form") as HTMLFormElement;
    private title = document.getElementById("title") as HTMLInputElement;
    private author = document.getElementById("author") as HTMLInputElement;
    private year = document.getElementById("year") as HTMLInputElement;
    public controller: AbortController = new AbortController();
    private darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
    private message = document.getElementById("message") as HTMLElement;
    private bookNotification: Modal = new Modal(this.message);
    private darkTheme: Theme = new Theme("dark-mode", "dark-mode");

    constructor() {
        super("books_list");
    }

    initEventListener(): void {
        this.bookForm.addEventListener("submit", async (event) => await this.addBook(event), { 
            signal: this.controller.signal 
        });

        this.darkToggle.addEventListener("change", (event) => this.handleThemeToggle(event), { 
            signal: this.controller.signal 
        });
    }

    private handleDarkTheme = this.darkTheme.debounce((isActived: boolean) => {
        this.darkTheme.changeTheme(isActived ? "active" : "inactive");
    }, 100);

    
    private handleThemeToggle(event: Event): void {
        this.handleDarkTheme((event.target as HTMLInputElement).checked);
    }

    private async addBook(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedTitle = this.title.value.trim();
        const isExist = this.currentData.some(item => item.title.trim().toLowerCase() === trimmedTitle);

        try {
            if (!trimmedTitle || !this.author.value.trim() || !this.year) {
                this.bookNotification.createModalComponent("Lengkapi data terlebih dahulu!");
                this.bookNotification.showModal();
                return;
            }

            if (isExist) {
                this.bookNotification.createModalComponent("Buku sudah ada/terdaftar");
                this.bookNotification.showModal();
                return;
            }
            
            await this.addToDatabase({
                title: this.title.value,
                author: this.author.value,
                released: Number(this.year.value)
            });
        } catch (error) {
            this.bookNotification.createModalComponent(`Gagal menambahkan buku ${error}`);
            this.bookNotification.showModal();
        }

        this.bookForm.reset();
    }
}

const formOfBook = new BookForm();

function initBookForm(): void {
    formOfBook.initEventListener();
}

function teardownBookForm(): void {
    formOfBook.controller.abort();
    formOfBook.teardownStorage();
}

document.addEventListener("DOMContentLoaded", initBookForm);
window.addEventListener("beforeunload", teardownBookForm);