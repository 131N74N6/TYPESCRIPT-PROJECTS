import TableStorage from "./storage";
import Modal from "./modal";
import type { Gender, NameAndTheirHobbies } from "./interface";

class HobbiesStacks extends TableStorage<NameAndTheirHobbies> {
    private controller: AbortController = new AbortController();
    private getSelectedId: string | null = null;
    private notification = document.getElementById("hobby-notification") as HTMLElement;
    private hobbiesModal = new Modal(this.notification);
    
    private dataList = document.getElementById("data-list") as HTMLElement;
    private searchForm = document.getElementById("searchForm") as HTMLFormElement;
    private searchInput = document.getElementById("searched-name") as HTMLInputElement;

    constructor() {
        super("hobbies_list");
    }

    async initEventListeners(): Promise<void> {
        await this.realtimeInit((data) => this.showAlluserDataAndHobby(data));

        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#close-filter')) this.resetfilter();
            else if (target.closest('#delete-all')) await this.deleteAllUser();
            else if (target.closest('#pop-name-and-hobby')) await this.popNameAndHobby();
        }, { signal: this.controller.signal });

        this.searchForm.addEventListener('submit', async (event) => this.handleFilterData(event), {
            signal: this.controller.signal
        });
    }

    showAlluserDataAndHobby(hobbies: NameAndTheirHobbies[]): void {
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

    private createComponent(detail: NameAndTheirHobbies): HTMLDivElement {
        const card = document.createElement("div") as HTMLDivElement;
        card.dataset.id = detail.id;
        card.className = "card";

        if (this.getSelectedId !== detail.id) {
            const username = document.createElement("div") as HTMLDivElement;
            username.className = "username";
            username.textContent = `Name: ${detail.name}`;

            const usergender = document.createElement("div") as HTMLDivElement;
            usergender.className = "user-gender";
            usergender.textContent = `gender: ${detail.gender}`;
            
            const userhobbies = document.createElement("div") as HTMLDivElement;
            userhobbies.className = "user-hobbies";
            userhobbies.textContent = `Hobby: ${detail.hobbies.join(', ')}`;

            const createdAt = document.createElement("div") as HTMLDivElement;
            createdAt.className = "created-at";
            createdAt.textContent = `Added at: ${detail.created_at.toLocaleString()}`;

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

            const buttonWrap = document.createElement("div") as HTMLDivElement;
            buttonWrap.className = 'button-wrap';
            buttonWrap.appendChild(selectButton);

            card.append(username, usergender, userhobbies, createdAt, buttonWrap);
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
            maleRadioButton.value = "Male";
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
            femaleRadioButton.value = "Female";
            femaleRadioButton.checked = (detail.gender === "Female");

            const choice2 = document.createElement("div") as HTMLDivElement;
            choice2.className = "female-radio-button-wrap";
            choice2.append(femaleRadioButton, femaleLabel);

            const genderWrap = document.createElement("div") as HTMLDivElement;
            genderWrap.className = "gender-wrap";
            genderWrap.append(choice1, choice2);

            const hobbiesWrap = document.createElement("div") as HTMLDivElement;
            hobbiesWrap.className = "hobbies-wrap";

            const hobbies = [
                "Reading", "Sports", "Playing Guitar", "Dance", "Listening Music", "Painting/Drawing"
            ];
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
                    const newGender = genderWrap
                    .querySelector(`input[name="gender-${detail.id}"]:checked`) as HTMLInputElement;
                    const newHobbies = hobbiesWrap
                    .querySelectorAll<HTMLInputElement>(`input[name="hobby-${detail.id}"]:checked`);
                    const getHobbyValue = Array.from(newHobbies).map(hobby => hobby.value);
                    await this.changeSelectedData(detail.id, {
                        name: trimmedUserName,
                        gender: newGender.value as Gender,
                        hobbies: getHobbyValue
                    });
                    this.getSelectedId = null;
                    this.updateExistingComponent(detail.id);
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

    showFilteredUser(users: NameAndTheirHobbies[]): void {
        const fragment = document.createDocumentFragment();

        this.dataList.innerHTML = '';
        users.forEach(user => fragment.appendChild(this.createComponent(user)));
        this.dataList.appendChild(fragment);
    }

    teardownHobby(): void {
        this.controller.abort();
        this.hobbiesModal.teardownModal();
    }

    resetfilter(): void {
        this.searchForm.reset();
        this.getSelectedId = null;
        this.showAlluserDataAndHobby(this.toArray());
    }

    private async popNameAndHobby(): Promise<void> {
        try {
            if (this.toArray().length > 0) {
                await this.pop();
                this.dataList.innerHTML = '';
                this.dataList.textContent = 'No Data Added...';
            } else {
                throw new Error('No Data Added!');
            }
        } catch (error: any) {
            this.hobbiesModal.createModal(`Failed to delete: ${error.message || error}`);
            this.hobbiesModal.showModal();
        }
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
    hobbyStack.teardownHobby();
}

document.addEventListener("DOMContentLoaded", initHobbiesStacks);
window.addEventListener("beforeunload", teardownHobbiesStacks);