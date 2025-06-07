import TableStorage from "./storage";
import Modal from "./modal";

const Gender = {
    Male: "Laki-laki",
    Female: "Perempuan"
} as const;

type Gender = typeof Gender[keyof typeof Gender];

interface UserInfo {
    id: string;
    created_at: Date;
    name: string;
    gender: Gender;
    hobbies: string[];
}

class HobbiesStacks extends TableStorage<UserInfo> {
    private controller: AbortController = new AbortController();
    private dataForm = document.getElementById("dataForm") as HTMLFormElement;
    private inputName = document.getElementById("name") as HTMLInputElement;
    private submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;

    private dataList = document.getElementById("data-list") as HTMLElement;
    private searchInput = document.getElementById("searched-name") as HTMLInputElement;
    private searchForm = document.getElementById("searchForm") as HTMLFormElement;
    private notification = document.getElementById("notification") as HTMLElement;
    private hobbiesModal = new Modal(this.notification);

    constructor() {
        super("hobbies");
    }

    initEventListeners(): void {}

    async addHobbiesAndUser(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = this.inputName.value.trim().toLowerCase();
        const data = Array.from(this.currentData.values());
        const isExist = data.some(dt => dt.name.toLowerCase() === trimmedValue);

        const selectedGender = document.querySelector<HTMLInputElement>(
            'input[name="gender"]:checked'
        )?.value as Gender;
        
        const selectedHobbies = Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked')
        ).map(hobby => hobby.value);

        if (trimmedValue === "" || !selectedGender || !selectedHobbies) {
            this.hobbiesModal.createModal("Missing required data...");
            this.hobbiesModal.teardownModal();
            this.dataForm.reset();
            return;
        }

        if (isExist) {
            this.hobbiesModal.createModal("Name already exist...");
            this.hobbiesModal.teardownModal();
            this.dataForm.reset();
            return;
        }

        await this.push({
            created_at: new Date(),
            name: trimmedValue,
            gender: selectedGender,
            hobbies: selectedHobbies
        });

        this.dataForm.reset();
    }

    showAllHobbiesAndUsers(): void {}

    createComponent(detail: UserInfo): HTMLDivElement {
        
    }
}

const hobbyStack = new HobbiesStacks();

function initHobbiesStacks(): void {
    hobbyStack.initEventListeners();
}

function teardownHobbiesStacks(): void {
    hobbyStack.teardown(); 
}

document.addEventListener("DOMContentLoaded", initHobbiesStacks);
window.addEventListener("beforeunload", teardownHobbiesStacks);