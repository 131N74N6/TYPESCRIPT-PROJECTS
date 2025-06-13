import TableStorage from "./storage";
import Modal from "./modal";

const Gender = { Male: "Laki-laki", Female: "Perempuan" } as const;

type Gender = typeof Gender[keyof typeof Gender];

interface UserInfo {
    id: string;
    created_at: Date;
    name: string;
    gender: Gender;
    hobbies: string[];
}

class HobbiesStacks extends TableStorage<UserInfo> {
    private dataForm = document.getElementById("dataForm") as HTMLFormElement;
    private inputName = document.getElementById("name") as HTMLInputElement;
    private submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
    private controller: AbortController = new AbortController();
    private getSelectedId: string | null = null;
    
    private dataList = document.getElementById("data-list") as HTMLElement;
    private searchForm = document.getElementById("searchForm") as HTMLFormElement;
    private searchInput = document.getElementById("searched-name") as HTMLInputElement;
    private notification = document.getElementById("notification") as HTMLElement;
    private hobbiesModal = new Modal(this.notification);

    constructor() {
        super("hobbies_list");
    }

    async initEventListeners(): Promise<void> {
        await this.realtimeInit((data) => this.showAlluserDataAndHobby(data));

        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#close-filter')) this.resetfilter();
            else if (target.closest('#delete-all')) await this.deleteAllUser();
        }, { signal: this.controller.signal });

        this.dataForm.addEventListener('submit', async (event) => this.addData(event), {
            signal: this.controller.signal
        });

        this.searchForm.addEventListener('submit', async (event) => this.handleFilterData(event), {
            signal: this.controller.signal
        });

        this.dataList.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('select-button')) {
                const userDataAndHobby = target.closest('.card') as HTMLDivElement;
                if (userDataAndHobby) {
                    const id = userDataAndHobby.dataset.id; // Pastikan card memiliki data-id
                    if (id) {
                        this.selectedUserData(id);
                    }
                }
            }
        }, { signal: this.controller.signal });
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

            if (this.getSelectedId === null) {
                await this.push({
                    created_at: new Date(),
                    name: trimmedValue,
                    gender: selectedGender,
                    hobbies: selectedHobbies
                });
            } else {
                await this.changeSelectedData(this.getSelectedId, {
                    name: trimmedValue,
                    gender: selectedGender,
                    hobbies: selectedHobbies
                });
            }
        } catch (error: any) {
            this.hobbiesModal.createModal(`Failed to add/change data: ${error.message || error}`);
            this.hobbiesModal.showModal();
        } finally {
            this.resetHobbyForm();
            this.hobbiesModal.teardownModal();
        }
    }

    showAlluserDataAndHobby(hobbies: UserInfo[]): void {
        const fragment = document.createDocumentFragment();
        const data = hobbies.sort((a,b) => b.created_at.getTime() - a.created_at.getTime());
        
        try {
            if (data.length > 0) {
                this.dataList.innerHTML = '';
                data.forEach(dt => fragment.appendChild(this.createComponent(dt)));
                this.dataList.appendChild(fragment);
            } else {
                this.dataList.innerHTML = '';
                this.dataList.textContent = 'Empty';
            }
        } catch (error: any) {
            this.hobbiesModal.createModal(`Error: ${error.message || error}`);
            this.hobbiesModal.showModal();
            this.dataList.innerHTML = '';
            this.dataList.textContent = 'Empty';
        }
    }

    private createComponent(detail: UserInfo): HTMLDivElement {
        const card = document.createElement("div") as HTMLDivElement;
        card.dataset.id = detail.id;
        card.className = "card";

        const username = document.createElement("div") as HTMLDivElement;
        username.className = "username";
        username.textContent = detail.name;

        const usergender = document.createElement("div") as HTMLDivElement;
        usergender.className = "user-gender";
        usergender.textContent = `gender: ${detail.gender}`;
        
        const userhobbies = document.createElement("div") as HTMLDivElement;
        userhobbies.className = "user-hobbies";
        userhobbies.textContent = `Hobby: ${detail.hobbies.join(', ')}`;

        const createdAt = document.createElement("div") as HTMLDivElement;
        createdAt.className = "created-at";
        createdAt.textContent = `Added at: ${detail.created_at.toLocaleString()}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = 'button-wrap';

        const selectButton = document.createElement("button") as HTMLButtonElement;
        selectButton.className = 'select-button';
        selectButton.type = 'button';
        selectButton.textContent = 'Select';

        card.append(username, usergender, userhobbies, createdAt, selectButton);
        return card;
    }

    private async handleFilterData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = this.searchInput.value.trim().toLowerCase();
        const filtered = this.toArray().filter(user => user.name.toLowerCase().includes(trimmedValue));

        if (trimmedValue === "" || !trimmedValue) {
            this.hobbiesModal.createModal("Fill the search input");
            this.hobbiesModal.showModal();
            this.searchForm.reset();
            return;
        }

        this.showFilteredUser(filtered);
    }

    showFilteredUser(users: UserInfo[]): void {
        const fragment = document.createDocumentFragment();

        this.dataList.innerHTML = '';
        users.forEach(user => fragment.appendChild(this.createComponent(user)));
        this.dataList.appendChild(fragment);
    }

    teardownHobby(): void {
        this.resetHobbyForm();
        this.controller.abort();
        this.hobbiesModal.teardownModal();
    }

    resetHobbyForm(): void {
        this.dataForm.reset();
        this.getSelectedId = null;
    }

    resetfilter(): void {
        this.searchForm.reset();
        this.getSelectedId = null;
        this.showAlluserDataAndHobby(this.toArray());
    }

    private selectedUserData(id: string): void {
        this.getSelectedId = id;
        this.submitBtn.textContent = 'Change';
        const data = this.toArray();
        const detail = data.find(dt => dt.id === this.getSelectedId);
        
        if (!detail) return;

        document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]')
        .forEach(checkbox => checkbox.checked = false);
        
        const oldGender = document.querySelector<HTMLInputElement>(`input[value="${detail.gender}"]`);
        detail.hobbies.forEach(hobby => {
            const oldHobby = document.querySelector<HTMLInputElement>(`input[value="${hobby}"][name="hobbies"]`);
            if (oldHobby) oldHobby.checked = true;
        });

        this.inputName.value = detail.name;
        if (oldGender) oldGender.checked = true;
    }

    private async deleteAllUser(): Promise<void> {
        try {
            const data = Array.from(this.currentData.values());
            if (data.length > 0) {
                await this.clear();
                this.dataList.innerHTML = '';
                this.dataList.textContent = 'Empty';
            } else {
                this.hobbiesModal.createModal('Empty');
                this.hobbiesModal.showModal();
                this.dataList.innerHTML = '';
                this.dataList.textContent = 'Empty';
            }
        } catch (error: any) {
            this.hobbiesModal.createModal(`Failed to delete all: ${error.message || error}`);
            this.hobbiesModal.showModal();
        }
    }
}

const hobbyStack = new HobbiesStacks();

async function initHobbiesStacks(): Promise<void> {
    await hobbyStack.initEventListeners();
}

function teardownHobbiesStacks(): void {
    hobbyStack.teardownTable(); 
    hobbyStack.resetHobbyForm();
    hobbyStack.teardownHobby();
}

document.addEventListener("DOMContentLoaded", initHobbiesStacks);
window.addEventListener("beforeunload", teardownHobbiesStacks);