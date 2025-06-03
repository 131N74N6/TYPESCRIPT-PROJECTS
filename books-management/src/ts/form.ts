import DatabaseStorage from "./storage";
import Modal from "./modal";
import Theme from "./theme";

interface Book {
    id: string;   
    title: string;   
    author: string; 
    released: number;
    created_at: Date;
}

class BookForm extends DatabaseStorage<Book> {
    public controller: AbortController = new AbortController();
    private bookForm = document.getElementById("book-form") as HTMLFormElement;
    private title = document.getElementById("title") as HTMLInputElement;
    private author = document.getElementById("author") as HTMLInputElement;
    private year = document.getElementById("year") as HTMLInputElement;

    private darkToggle = document.getElementById("dark-mode") as HTMLInputElement;
    private message = document.getElementById("message") as HTMLElement;
    private darkTheme: Theme = new Theme("dark-mode", "dark-mode");
    private formNotification: Modal;

    constructor() {
        super("books_list");
        this.formNotification = new Modal(this.message);
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
        const getData = Array.from(this.currentData.values());
        const isExist = getData.some(item => item.title.trim().toLowerCase() === trimmedTitle);

        try {
            if (!trimmedTitle || !this.author.value.trim() || !this.year) {
                this.formNotification.createModalComponent("Fulfill the form!");
                this.formNotification.showModal();
                return;
            }

            if (isExist) {
                this.formNotification.createModalComponent("Buku sudah ada/terdaftar");
                this.formNotification.showModal();
                return;
            }
            
            await this.addToDatabase({
                title: this.title.value,
                created_at: new Date(),
                author: this.author.value,
                released: Number(this.year.value)
            });

            this.formNotification.createModalComponent("Book sucessfully added!");
            this.formNotification.showModal();
        } catch (error) {
            this.formNotification.createModalComponent(`Failed to add book: ${error}`);
            this.formNotification.showModal();
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