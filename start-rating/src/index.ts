import DataManager from "./storage.js";

interface Rating {
    id: string;
    name: string;
    rating: number;
    comment: string;
}

const starWidgets = document.getElementById("star-widgets") as HTMLFormElement;

class User extends DataManager<Rating> {
    private controllers: AbortController;
    private selectedId: string | null = null;

    constructor() {
        super("user-rating");
        this.controllers = new AbortController();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
        }, { signal: this.controllers.signal });
    }



    protected deleteAllRatings(): void {
        this.deleteAllData();
    }

    cleanUp(): void {
        this.controllers.abort();
        this.controllers = new AbortController();
    }
}