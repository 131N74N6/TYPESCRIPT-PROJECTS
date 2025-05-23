import DataManager from "./storage";
import Modal from "./components/modal";
import type Item from "./model/item";

const inputSection = document.getElementById("inputSection") as HTMLFormElement;
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const dynamicFields = document.getElementById("dynamicFields") as HTMLDivElement;
const modalMessage = document.getElementById("modal-msg") as HTMLElement;

class FormHandler extends DataManager<Item>{
    controller: AbortController = new AbortController();
    private formModal: Modal;

    constructor() {
        super("dynamic input field");
        this.formModal = new Modal(modalMessage);
        this.setEventListeners();
    }
    
    private setEventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (target.closest("#addFieldBtn")) this.addNewField();
        }, { signal: this.controller.signal });

        inputSection.addEventListener("submit", (event) => this.submitData(event), { 
            signal: this.controller.signal
        });
    }

    private createInputField(value?: string): HTMLInputElement {
        const input = document.createElement('input');
        input.className = 'additional-detail';
        input.type = 'text';
        input.placeholder = 'Detail tambahan';
        if (value) input.value = value;
        return input;
    }

    private addNewField(): void {
        dynamicFields.appendChild(this.createInputField());
    }

    private async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const smallText = nameInput.value.toLowerCase();
        const data = await this.loadFromStorage();
        const isExist = data.some(data => data.name.toLowerCase().includes(smallText));

        const newData: Omit<Item, 'id'> = {
            name: nameInput.value,
            detail: Array.from(document.querySelectorAll<HTMLInputElement>('#dynamicFields input'))
                .map((input: HTMLInputElement) => input.value.trim())
                .filter(v => v)
        }

        if (nameInput.value.trim().length === 0) {
            this.formModal.createModalComponent("input tidak boleh kosong!");
            this.formModal.showModal();
            return;
        }
        
        try {
            !isExist ? await this.addToStorage(newData) : 
            this.formModal.createModalComponent("Data sudah ada");
            this.formModal.showModal();
        } catch (error) {
            this.formModal.createModalComponent(`Error: ${error}`);
            this.formModal.showModal();
        }

        inputSection.reset();
    }
}

const formHandler = new FormHandler();

function initIndex(): void {
    formHandler;
}

function teardown(): void {
    formHandler.controller.abort();
}

document.addEventListener("DOMContentLoaded", initIndex);
window.addEventListener("beforeunload", teardown);