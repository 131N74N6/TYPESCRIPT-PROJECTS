import DataManager from "./supabase-table";
import Modal from "./modal";

interface Rating {
    id: string;
    name: string;
    rating: number;
    comment: string;
    created_at: Date;
}

class UserRating extends DataManager<Rating> {
    private header: HTMLElement;
    private ascendSort: HTMLInputElement; 
    private descendSort: HTMLInputElement;
    private ratingFilter: NodeListOf<HTMLInputElement>;
    private rating: number[] = [1, 2, 3, 4, 5];

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
        ratingsList: HTMLElement, saveButton: HTMLButtonElement, notification: HTMLElement, 
        header: HTMLElement, ascendSort: HTMLInputElement, descendSort: HTMLInputElement, 
        ratingFilter: NodeListOf<HTMLInputElement>
    ) {
        super("ratings_list");
        this.header = header;
        this.ascendSort = ascendSort;
        this.descendSort = descendSort;
        this.ratingFilter = ratingFilter;

        this.starWidgets = starWidgets;
        this.username = username;
        this.comment = comment;
        this.ratingsList = ratingsList;
        this.saveButton = saveButton;
        this.controllers = new AbortController();
        this.modalComponent = new Modal(notification);
    }

    async setupEventListeners(): Promise<void> {
        await this.realtimeInit((ratings) => this.showAllRatings(ratings));

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-ratings")) this.deleteAllRatings();
            else if (target.closest("#clear-form")) this.resetOpinionForm();
        }, { signal: this.controllers.signal });

        this.header.addEventListener("change", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#ascend-sort")) this.sortFromOldest();
            else if (target.closest("#descend-sort")) this.sortFromNewest();
            else if (target.closest('.header input[type="checkbox"]')) {
                this.ratingFilter.forEach(rateFilter => {
                    rateFilter.addEventListener("change", () => {
                        this.rating = Array.from(this.ratingFilter)
                        .filter(getData => getData.checked)
                        .map(getValue => Number(getValue.value) as Rating['rating']);
                        this.showAllRatings(this.toArray());
                    }, { signal: this.controllers.signal });
                });
            }
        }, { signal: this.controllers.signal });

        this.starWidgets.addEventListener("submit", async (event) => await this.submitRating(event), {
            signal: this.controllers.signal
        });
    }

    sortFromNewest(): void {
        this.ascendSort.checked = false;
        this.showAllRatings(this.toArray());
    }

    sortFromOldest(): void {
        this.descendSort.checked = false;
        this.showAllRatings(this.toArray());
    }

    async showAllRatings(ratings: Rating[]): Promise<void> {
        const opinionComponent = document.createDocumentFragment();
        if (ratings.length > 0) {
            const filteredData = this.toArray().filter(rate => this.rating.includes(rate.rating));
            let modifiedData = filteredData;

            if (this.ascendSort.checked) {
                modifiedData = [...filteredData].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
            } else if (this.descendSort.checked) {
                modifiedData = [...filteredData].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
            }

            modifiedData.forEach(data => opinionComponent.appendChild(this.makeRatingList(data)));
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

        const comment = document.createElement("p") as HTMLParagraphElement;
        comment.className = "comment";
        comment.textContent = content.comment;

        const createdAt = document.createElement('p') as HTMLParagraphElement;
        createdAt.className = "created-at";
        createdAt.textContent = content.created_at.toLocaleString();

        const buttonWrapper = document.createElement("div") as HTMLDivElement;
        buttonWrapper.className = "button-wrap";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.className = "select-button";
        selectBtn.textContent = "select";
        selectBtn.style.textTransform = "capitalize";
        selectBtn.addEventListener("click", async () => await this.selectedRating(content.id), { 
            signal: this.controllers.signal 
        });

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-button";
        deleteBtn.textContent = "delete";
        deleteBtn.style.textTransform = "capitalize";
        deleteBtn.addEventListener("click",  async () => await this.deleteRating(content.id), { 
            signal: this.controllers.signal 
        });

        buttonWrapper.append(selectBtn, deleteBtn);

        opinion.append(username, this.makeStar(content.rating), comment, createdAt, buttonWrapper);
        return opinion;
    }

    private async submitRating(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const createRating = document.querySelector('input[name="rate"]:checked') as HTMLInputElement;

        try {
            if (this.selectedId !== null) {
                await this.changeSelectedData(this.selectedId, {
                    name: this.username.value.trim() || `user_${Date.now()}`,
                    rating: Number(createRating.value.trim()),
                    comment: this.comment.value.trim()
                });
            } else {
                await this.insertData({
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
                star.style.color = "#f2faed";
                starWrap.appendChild(star);
            } else {
                star.className = "fa-solid fa-star";
                star.style.color = "#5a5384";
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
        const getData = this.currentData.get(id);
        if (!getData) return;
        const starTotal = String(getData.rating);

        this.username.value = getData.name;
        (document.querySelector(`input[value="${starTotal}"]`) as HTMLInputElement).checked = true;
        this.comment.value = getData.comment;
        this.saveButton.textContent = "Edit Data";
    }

    private async deleteRating(id: string): Promise<void> {
        try {
            await this.deleteData(id);
            if (this.selectedId === id) this.resetOpinionForm();
        } catch (error) {
            this.modalComponent.createModalComponent("Error when deleting rates");
            this.modalComponent.showModal();
        }
    }

    private async deleteAllRatings(): Promise<void> {
        try {
            if (this.currentData.size > 0) {
                await this.deleteData();
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