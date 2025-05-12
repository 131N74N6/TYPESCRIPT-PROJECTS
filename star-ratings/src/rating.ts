import Modal from "./modal.js";
import DataManager from "./storage.js";

interface Rating {
    id: string;
    name: string;
    rating: number;
    comment: string;
}

const starWidgets = document.getElementById("star-widgets") as HTMLFormElement;
const username = document.getElementById("username") as HTMLInputElement;
const comment = document.getElementById("comment") as HTMLTextAreaElement;
const ratingsList = document.getElementById("ratings-list") as HTMLElement;
const saveButton = document.getElementById("save-btn") as HTMLButtonElement;

class UserRating extends DataManager<Rating> {
    starWidgets: HTMLFormElement;
    username: HTMLInputElement;
    comment: HTMLTextAreaElement;
    ratingsList: HTMLElement;
    saveButton: HTMLButtonElement;
    private controllers: AbortController;
    private selectedId: string | null = null;

    constructor(
        starWidgets: HTMLFormElement, username: HTMLInputElement, comment: HTMLTextAreaElement, 
        ratingsList: HTMLElement, saveButton: HTMLButtonElement
    ) {
        super("star ratings");
        this.controllers = new AbortController();
        this.setupEventListeners();
        this.starWidgets = starWidgets;
        this.username = username;
        this.comment = comment;
        this.ratingsList = ratingsList;
        this.saveButton = saveButton;
    }

    private setupEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (target.closest("#delete-all-ratings")) this.deleteAllRatings();
            if (target.closest("#clear-form")) this.resetOpinionForm();
        }, { signal: this.controllers.signal });

        starWidgets.addEventListener("submit", async (event) => await this.submitRating(event), {
            signal: this.controllers.signal
        });
    }

    async showAllRatings(): Promise<void> {
        try {
            const ratingsData = await this.loadFromStorage();
            console.log(ratingsData);

            if (ratingsData.length > 0) {
                const opinionComponent = document.createDocumentFragment();
                ratingsData.forEach(data => opinionComponent.appendChild(this.makeRatingList(data)));
                ratingsList.innerHTML = '';
                ratingsList.appendChild(opinionComponent);
            }
        } catch (error) {
            console.log(error);
        }
    }

    private makeRatingList(content: Rating): HTMLDivElement {
        const opinion = document.createElement("div") as HTMLDivElement;
        opinion.className = "opinion";

        const username = document.createElement("div") as HTMLDivElement;
        username.style.fontWeight = "700";
        username.style.textTransform = 'capitalize';
        username.className = "username";
        username.textContent = content.name;

        const comment = document.createElement("div") as HTMLDivElement;
        comment.className = "comment";
        comment.textContent = content.comment;

        const buttonWrapper = document.createElement("div") as HTMLDivElement;
        buttonWrapper.className = "button-wrap";
        buttonWrapper.style.display = "flex";
        buttonWrapper.style.gap = "0.6rem";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.className = "select-btn";
        selectBtn.textContent = "select";
        selectBtn.style.textTransform = "capitalize";
        selectBtn.addEventListener("click", async () => await this.selectedRating(content.id), { 
            signal: this.controllers.signal 
        });

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "delete";
        deleteBtn.style.textTransform = "capitalize";
        deleteBtn.addEventListener("click",  async () => await this.deleteRating(content.id), { 
            signal: this.controllers.signal 
        });

        buttonWrapper.append(selectBtn, deleteBtn);

        opinion.append(username, this.makeStar(content.rating), comment, buttonWrapper);
        return opinion;
    }

    private async submitRating(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const isInEditMode = !!this.selectedId;
        const createRating = document.querySelector('input[name="rate"]:checked') as HTMLInputElement;

        if (!username.value.trim()) {
            new Modal("Masukkan nama yang valid!");
            return;
        }

        const newRating: Omit<Rating, 'id'> = {
            name: username.value.trim(),
            rating: Number(createRating.value.trim()),
            comment: comment.value.trim()
        }

        if (!isInEditMode) {
            this.addToStorage(newRating as Omit<Rating, 'id'>);
        } else {
            this.changeSelectedData(this.selectedId as string, newRating);
        }

        this.resetOpinionForm();
        this.showAllRatings();
    }

    private resetOpinionForm(): void {
        starWidgets.reset();
        this.selectedId = null;
        saveButton.textContent = "Send";
    }

    private makeStar(starTotal: number): HTMLDivElement {
        const starToNumber: number = starTotal * 2;
        const starWrap = document.createElement("div") as HTMLDivElement;
        const starValue = document.createElement("div") as HTMLDivElement;
        starWrap.className = "star-wrap";
        starValue.className = "star-value";
        let x: number;

        for (x = 1; x <= 5; x++) {
            const star = document.createElement("i") as HTMLElement;
            if (x <= starTotal) {
                star.className = "fa-solid fa-star";
                star.style.color = "#CDD3F4";
                starWrap.appendChild(star);
            } else {
                star.className = "fa-solid fa-star";
                star.style.color = "#052A6A";
                starWrap.appendChild(star);
            }
        }

        starValue.textContent = `(${starToNumber}/10)`;
        starWrap.appendChild(starValue);
        starWrap.style.display = "flex";
        starWrap.style.gap = "0.3rem";

        return starWrap;
    }

    private async selectedRating(id: string): Promise<void> {
        this.selectedId = id;
        const getRatingData = await this.loadFromStorage();
        const index = getRatingData.findIndex(data => data.id === id);
        const starTotal = String(getRatingData[index].rating);

        username.value = getRatingData[index].name;
        (document.querySelector(`input[value="${starTotal}"]`) as HTMLInputElement).checked = true;
        comment.value = getRatingData[index].comment;
        saveButton.textContent = "Edit Data";
    }

    private async deleteRating(id: string): Promise<void> {
        try {
            await this.deleteSelectedData(id);
            if (this.selectedId === id) this.resetOpinionForm();
            this.showAllRatings();
        } catch (error) {
            new Modal("Error when deleting rates");
        }
    }

    private async deleteAllRatings(): Promise<void> {
        try {    
            this.deleteAllData();
            ratingsList.replaceChildren();
            this.resetOpinionForm();
        } catch (error) {
            new Modal("Error when deleting rates");
        }
    }

    cleanUp(): void {
        this.controllers.abort();
        this.resetOpinionForm();
    }
}

export default UserRating;