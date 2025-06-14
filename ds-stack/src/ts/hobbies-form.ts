import type { Gender, NameAndTheirHobbies } from "./interface";
import TableStorage from "./storage";
import Modal from "./modal";

class HobbyForm extends TableStorage<NameAndTheirHobbies>{
    private controller = new AbortController();
    private dataForm = document.getElementById("data-form") as HTMLFormElement;
    private inputName = document.getElementById("name") as HTMLInputElement;
    private hobbyFormNotice = document.getElementById("hobby-form-modal") as HTMLElement;
    private hobbiesModal = new Modal(this.hobbyFormNotice);

    constructor() {
        super("hobbies_list");
    }

    initEventListeners(): void {
        this.dataForm.addEventListener('submit', async (event) => this.addData(event), {
            signal: this.controller.signal
        });
    }
    async addData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = this.inputName.value.trim().toLowerCase();
        const isExist = this.toArray().some(dt => dt.name.toLowerCase() === trimmedValue);
        
        const selectedGenderElement = document.querySelector<HTMLInputElement>('input[name="gender"]:checked');
        const selectedGender = selectedGenderElement?.value as Gender;

        const selectedHobbiesElements = document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked');
        const selectedHobbies = Array.from(selectedHobbiesElements).map(hobby => hobby.value);
        
        try {
            if (trimmedValue === "" || !selectedGender || !selectedHobbies) {
                this.hobbiesModal.createModal("Missing required data...");
                this.hobbiesModal.showModal();
                return;
            }

            if (isExist) {
                this.hobbiesModal.createModal("Name already exist...");
                this.dataForm.reset();
                this.hobbiesModal.showModal();
                return;
            }

            await this.push({
                created_at: new Date(),
                name: trimmedValue,
                gender: selectedGender,
                hobbies: selectedHobbies
            });
        } catch (error: any) {
            this.hobbiesModal.createModal(`Failed to add/change data: ${error.message || error}`);
            this.hobbiesModal.showModal();
        } finally {
            this.dataForm.reset();
            this.hobbiesModal.teardownModal();
        }
    }

    teardownForm(): void {
        this.controller.abort();
    }
}

const nameAndHobbyForm = new HobbyForm();

function initNameAndHobbyForm(): void {
    nameAndHobbyForm.initEventListeners();
}

function teardownNameAndHobbyForm(): void {
    nameAndHobbyForm.teardownForm();
}

document.addEventListener("DOMContentLoaded", initNameAndHobbyForm);
window.addEventListener("beforeunload", teardownNameAndHobbyForm);