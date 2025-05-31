import DataManager from "./storage";
import Modal from "./modal";

interface Rating {
    id: string;
    name: string;
    rating: number;
    comment: string;
    created_at: Date;
}

class UserRating extends DataManager<Rating> {
    private starWidgets: HTMLFormElement;
    private username: HTMLInputElement;
    private comment: HTMLTextAreaElement;
    private saveButton: HTMLButtonElement;
    private ratingsList: HTMLElement;
    private modalComponent: Modal;
    private controllers: AbortController;
    private selectedId: string | null = null;

    constructor(
        starWidgets: HTMLFormElement, username: HTMLInputElement, comment: HTMLTextAreaElement, 
        ratingsList: HTMLElement, saveButton: HTMLButtonElement, notification: HTMLElement
    ) {
        super("ratings_list");
        this.starWidgets = starWidgets;
        this.username = username;
        this.comment = comment;
        this.ratingsList = ratingsList;
        this.saveButton = saveButton;
        this.controllers = new AbortController();
        this.modalComponent = new Modal(notification);
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        this.realtimeInit(() => {
            this.showAllRatings();
        });

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-ratings")) this.deleteAllRatings();
            else if (target.closest("#clear-form")) this.resetOpinionForm();
        }, { signal: this.controllers.signal });

        this.starWidgets.addEventListener("submit", async (event) => await this.submitRating(event), {
            signal: this.controllers.signal
        });
    }

    async showAllRatings(): Promise<void> {
        this.ratingsList.innerHTML = '';

        if (this.currentData.length > 0) {
            const opinionComponent = document.createDocumentFragment();
            this.currentData.forEach(data => opinionComponent.appendChild(this.makeRatingList(data)));
            this.ratingsList.innerHTML = '';
            this.ratingsList.appendChild(opinionComponent);
        } else {
            this.ratingsList.innerHTML = '';
            this.ratingsList.textContent = '...No Rating Added...';
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
        const createRating = document.querySelector('input[name="rate"]:checked') as HTMLInputElement;

        try {
            if (this.selectedId !== null) {
                await this.changeSelectedData(this.selectedId, {
                    created_at: new Date(),
                    name: this.username.value.trim() || `user_${Date.now()}`,
                    rating: Number(createRating.value.trim()),
                    comment: this.comment.value.trim()
                });
            } else {
                await this.addToStorage({
                    created_at: new Date(),
                    name: this.username.value.trim() || `user_${Date.now()}`,
                    rating: Number(createRating.value.trim()),
                    comment: this.comment.value.trim()
                });
            }
        } catch (error) {
            this.modalComponent.createModalComponent(`Failed to add rating ${error}`);
            this.modalComponent.showModal();
        }
        this.resetOpinionForm();
    }

    private resetOpinionForm(): void {
        this.starWidgets.reset();
        this.selectedId = null;
        this.saveButton.textContent = "Send";
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
        const index = this.currentData.findIndex(data => data.id === id);
        const starTotal = String(this.currentData[index].rating);

        this.username.value = this.currentData[index].name;
        (document.querySelector(`input[value="${starTotal}"]`) as HTMLInputElement).checked = true;
        this.comment.value = this.currentData[index].comment;
        this.saveButton.textContent = "Edit Data";
    }

    private async deleteRating(id: string): Promise<void> {
        try {
            await this.deleteSelectedData(id);
            if (this.selectedId === id) this.resetOpinionForm();
        } catch (error) {
            this.modalComponent.createModalComponent("Error when deleting rates");
            this.modalComponent.showModal();
        }
    }

    private async deleteAllRatings(): Promise<void> {
        try {
            if (this.currentData.length > 0) {
                await this.deleteAllData();
                this.resetOpinionForm();
                this.teardownStorage();
                this.ratingsList.innerHTML = '';
                this.ratingsList.textContent = '...No Rating Added...';
            } else {
                this.modalComponent.createModalComponent("add one rating");
                this.modalComponent.showModal();
            }
        } catch (error) {
            this.modalComponent.createModalComponent("Error when deleting rates");
            this.modalComponent.showModal();
        }
    }

    cleanUp(): void {
        this.selectedId = null;
        this.controllers.abort();
        this.modalComponent.teardownModal();
        this.teardownStorage();
        this.resetOpinionForm();
    }
}

export default UserRating;