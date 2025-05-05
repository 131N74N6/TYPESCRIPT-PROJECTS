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
            const allOpinions = Array.from(document.querySelectorAll(".opinion"));
            const selectButton = target.closest(".select-btn");
            const selectedOpinion = selectButton?.closest(".opinion");

            const deleteButton = target.closest(".delete-btn");
            const deleteOneOpinion = deleteButton?.closest(".opinion");

            const selectingOpinionIndex = allOpinions.indexOf(selectedOpinion as Element);
            const deletingOneOpinionIndex = allOpinions.indexOf(deleteOneOpinion as Element);

            if (selectingOpinionIndex > -1) {
                const opinionData = this.getAllData()[selectingOpinionIndex];
                this.selectedRating(opinionData.id);
            }

            if (deletingOneOpinionIndex > -1) {
                const opinionData = this.getAllData()[deletingOneOpinionIndex];
                this.deleteRating(opinionData.id);
            }

            if (target.closest("#clear-form")) this.resetOpinionForm();
        }, { signal: this.controllers.signal });

        starWidgets.addEventListener("submit", (event) => this.submitRating(event), {
            signal: this.controllers.signal
        });
    }

    showAllRatings(): void {
        const opinionComponent = document.createDocumentFragment();
        const data = this.getAllData();
        data.forEach(dt => opinionComponent.appendChild(this.makeRatingList(dt)));
        ratingsList.innerHTML = '';
        ratingsList.appendChild(opinionComponent);
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

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.className = "delete-btn";
        deleteBtn.textContent = "delete";
        deleteBtn.style.textTransform = "capitalize";

        buttonWrapper.append(selectBtn, deleteBtn);

        opinion.append(username, this.makeStar(content.rating), comment, buttonWrapper);
        return opinion;
    }

    private submitRating(event: SubmitEvent): void {
        event.preventDefault();
        const isInEditMode = !!this.selectedId;
        const createRating = document.querySelector('input[name="rate"]:checked') as HTMLInputElement;

        if (!username.value.trim()) {
            new Modal("Masukkan nama yang valid!");
            return;
        }

        const newRating: Partial<Rating> = {
            name: username.value.trim(),
            rating: Number(createRating.value.trim()),
            comment: comment.value.trim()
        }

        if (!isInEditMode) {
            this.addNewData(newRating as Omit<Rating, 'id'>);
        } else {
            try {
                const existingData = this.getAllData().find(data => data.id === this.selectedId);

                if (!existingData) { throw new Error('Data tidak ditemukan'); }
                
                this.changeSelectedData(this.selectedId as string, newRating);
            } catch (error) {
                new Modal("Opini belum ada atau sudah dihapus");
                this.resetOpinionForm();
            }
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

    private selectedRating(id: string): void {
        this.selectedId = id;
        const index = this.getAllData().findIndex(data => data.id === id);
        const getRatingData = this.getAllData();
        const starTotal = String(getRatingData[index].rating);

        username.value = getRatingData[index].name;
        (document.querySelector(`input[value="${starTotal}"]`) as HTMLInputElement).checked = true;
        comment.value = getRatingData[index].comment;
        saveButton.textContent = "Edit Data";
    }

    private deleteRating(id: string): void {
        this.deleteSelectedData(id);
        this.showAllRatings();
    }

    protected deleteAllRatings(): void {
        this.deleteAllData();
        ratingsList.replaceChildren();
        this.resetOpinionForm();
    }

    cleanUp(): void {
        this.controllers.abort();
    }
}

let user: User;

function init(): void {
    user = new User();
    user.showAllRatings();
}

function teardown(): void {
    user.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);