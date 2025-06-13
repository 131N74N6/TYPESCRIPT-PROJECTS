import TableStorage from "./storage";
import Modal from "./modal";

const Gender = { Male: "Male", Female: "Female" } as const;

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

        if (this.getSelectedId !== detail.id) {
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
            selectButton.onclick = () => {
                const previousId = this.getSelectedId;
                this.getSelectedId = detail.id;
                this.updateExistingComponent(this.getSelectedId);

                if (previousId && previousId !== this.getSelectedId) {
                    this.updateExistingComponent(previousId);
                }
            }

            card.append(username, usergender, userhobbies, createdAt, selectButton);
        } else {
            const newUserName = document.createElement("input") as HTMLInputElement;
            newUserName.type = "text";
            newUserName.placeholder = "enter new username...";
            newUserName.value = detail.name;

            const maleLabel = document.createElement("label") as HTMLLabelElement;
            maleLabel.htmlFor = `male-${detail.id}`;
            maleLabel.textContent = "Male";

            const maleRadioButton = document.createElement("input") as HTMLInputElement;
            maleRadioButton.type = "radio";
            maleRadioButton.id = `male-${detail.id}`;
            maleRadioButton.name = `gender-${detail.id}`;
            maleRadioButton.checked = (detail.gender === "Male");

            const choice1 = document.createElement("div") as HTMLDivElement;
            choice1.className = "male-radio-button-wrap";
            choice1.append(maleRadioButton, maleLabel);

            const femaleLabel = document.createElement("label") as HTMLLabelElement;
            femaleLabel.htmlFor = `female-${detail.id}`;
            femaleLabel.textContent = "Female"

            const femaleRadioButton = document.createElement("input") as HTMLInputElement;
            femaleRadioButton.type = "radio";
            femaleRadioButton.id = `female-${detail.id}`;
            femaleRadioButton.name = `gender-${detail.id}`;
            femaleRadioButton.checked = (detail.gender === "Female");

            const choice2 = document.createElement("div") as HTMLDivElement;
            choice2.className = "female-radio-button-wrap";
            choice2.append(femaleRadioButton, femaleLabel);

            const genderWrap = document.createElement("div") as HTMLDivElement;
            genderWrap.className = "gender-wrap";
            genderWrap.append(choice1, choice2);

            const hobbiesWrap = document.createElement("div") as HTMLDivElement;
            hobbiesWrap.className = "hobbies-wrap";

            const hobbies = ["Membaca", "Olahraga", "Musik", "Melukis/Menggambar"];
            hobbies.forEach((hobby) => {
                const hobbyCheckbox = document.createElement("input") as HTMLInputElement;
                hobbyCheckbox.type = "checkbox";
                hobbyCheckbox.name = `hobby-${detail.id}`;
                hobbyCheckbox.id = `${hobby}-${detail.id}`;
                hobbyCheckbox.value = hobby;
                hobbyCheckbox.checked = detail.hobbies.includes(hobby);

                const hobbyLabel = document.createElement("label") as HTMLLabelElement;
                hobbyLabel.htmlFor = `${hobby}-${detail.id}`;
                hobbyLabel.textContent = hobby;

                hobbiesWrap.append(hobbyCheckbox, hobbyLabel);
            });

            const saveChanges = document.createElement("button") as HTMLButtonElement;
            saveChanges.type = "button";
            saveChanges.className = "edit-button";
            saveChanges.textContent = "Save";
            saveChanges.onclick = async () => {
                try {
                    const trimmedUserName = newUserName.value.trim();
                    const selectedGender = genderWrap
                    .querySelector(`input[name="gender-${detail.id}"]:checked`) as HTMLInputElement;
                    await this.changeSelectedData(detail.id, {
                        name: trimmedUserName,
                        
                    });
                } catch (error: any) {
                    this.hobbiesModal.createModal(`Failed to save change: ${error.message || error}`);
                    this.hobbiesModal.showModal();
                }
            }
            
            const cancelButton = document.createElement("button") as HTMLButtonElement;
            cancelButton.type = "button";
            cancelButton.className = "cancel-button";
            cancelButton.textContent = "Cancel";
            cancelButton.onclick = () => {
                this.getSelectedId = null;
                this.updateExistingComponent(detail.id);
            }

            const buttonWrap = document.createElement("div") as HTMLDivElement;
            buttonWrap.className = "button-wrap";
            buttonWrap.append(saveChanges, cancelButton);

            card.append(newUserName, genderWrap, hobbiesWrap, buttonWrap);
        }
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

    private updateExistingComponent(userId: string) {
        const component = this.dataList.querySelector(`.card[data-id="${userId}"]`);
        if (component) {
            const getData = this.currentData.get(userId);
            if (getData) {
                const changedComponent = this.createComponent(getData);
                changedComponent.dataset.id = getData.id;
                component.replaceWith(changedComponent);
            } else {
                component.remove();
                if (this.toArray().length === 0) {
                    this.dataList.innerHTML = '';
                    this.dataList.textContent = 'Empty';
                }
            }
        } else {
            this.showAlluserDataAndHobby(this.toArray());
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