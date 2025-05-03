import DataManager from "./storage.js";

interface Rating {
    id: string;
    name: string;
    rating: number;
    comment: string;
}

const starWidgets = document.getElementById("star-widgets") as HTMLFormElement;
const username = document.getElementById("username") as HTMLInputElement;
const comment = document.getElementById("comment") as HTMLInputElement;
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
        ratingsList.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            const selectButton = target.closest(".select-btn");
            const selectedOpinion = selectButton?.closest(".opinion");

            const deleteButton = target.closest(".delete-btn");
            const deleteOneOpinion = deleteButton?.closest(".opinion");

            const allOpinions = Array.from(document.querySelectorAll(".opinion"));
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

        const rating = document.createElement("div") as HTMLDivElement;
        rating.className = "rating";
        rating.textContent = String(content.rating);

        const star = document.createElement("i") as HTMLElement;
        star.className = "fa-solid fa-star";

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

        opinion.append(username, rating, comment, buttonWrapper);
        return opinion;
    }

    private submitRating(event: SubmitEvent): void {
        event.preventDefault();
        const createRating = document.querySelector('input[name="rate"]:checked') as HTMLInputElement;
        const createdRate = Number(createRating.value);
        const isInEditMode = !!this.selectedId;

        const newRating: Omit<Rating, 'id'> = {
            name: username.value,
            rating: createdRate,
            comment: comment.value
        }

        if (!isInEditMode) {
            this.addNewData(newRating);
        } else {
            this.changeSelectedData(this.selectedId as string, newRating);
        }

        starWidgets.reset();
        this.selectedId = null;
        this.showAllRatings();
        saveButton.textContent = "Send";
    }

    selectedRating(id: string): void {
        this.selectedId = id;
        const index = this.getAllData().findIndex(data => data.id === id);
        const getRatingData = this.getAllData();
        const starTotal = String(getRatingData[index].rating);

        username.value = getRatingData[index].name;
        (document.querySelector(`input[value=${starTotal}]`) as HTMLInputElement).checked = true;
        comment.value = getRatingData[index].comment;
        saveButton.textContent = "Edit Data";
    }

    deleteRating(id: string): void {
        this.deleteSelectedData(id);
        this.showAllRatings();
    }

    protected deleteAllRatings(): void {
        this.deleteAllData();
        ratingsList.replaceChildren();
    }

    cleanUp(): void {
        this.controllers.abort();
        this.controllers = new AbortController();
        this.setupEventListeners();
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