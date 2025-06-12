import StorageManager from "./storage";

type Activity = {
    id: string;
    act_name: string;
    created_at: Date;
}

const dataStorage = StorageManager<Activity>("activity_list");

const ActivityManagement = (
    notification: HTMLElement, activityForm: HTMLFormElement, activityList: HTMLElement, 
    activityName: HTMLTextAreaElement, submitButton: HTMLButtonElement
) => ({
    controller: new AbortController() as AbortController,
    selectedActId: null as string | null,
    timeout: null as number | null,
    modal: document.createElement("div") as HTMLDivElement,
    modalText: document.createElement("p") as HTMLParagraphElement,

    async initEventListeners(): Promise<void> {
        await dataStorage.realtimeInit((data) => this.showAllActivities(data));

        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-button")) this.deleteAllActivities();
            else if (target.closest("#reset-form-btn")) this.resetActivityForm();
        }, { signal: this.controller.signal });

        activityList.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            const listComponents = target.closest(".list-component") as HTMLElement | null;
            if (!listComponents) return; 

            const fileId = listComponents.dataset.id;
            if (!fileId || fileId === null) {
                this.showAndCreateModal("File ID not found or invalid on clicked card.");
                this.teardownModal();
                return;
            }

            if (target.closest(".select-button")) {
                this.selectActivity(fileId);
            } else if (target.closest(".delete-button")) {
                await this.deleteAct(fileId);
            }
        }, { signal: this.controller.signal });

        activityForm.addEventListener("submit", (event) => this.submitActivity(event), { 
            signal: this.controller.signal 
        });
    },

    async showAllActivities(activities: Activity[]): Promise<void> {
        try{
            const activityFragment = document.createDocumentFragment();;
            if (activities.length > 0) {
                activityList.innerHTML = '';
                activities.forEach(act => activityFragment.appendChild(
                    this.createActivityComponent(act)
                ));
                activityList.appendChild(activityFragment);
            } else {
                activityList.innerHTML = '';
                activityList.textContent = "No activities yet...";
            }
        } catch(error) {
            this.showAndCreateModal(`Failed to show data: ${error}`);
            this.teardownModal();
            activityList.innerHTML = '';
            activityList.textContent = "No activities yet...";
        }
    },

    async submitActivity(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const inputValue = activityName.value.trim();
        const isExist = dataStorage.currentData
        .some(act => act.act_name.toLowerCase() === inputValue.toLowerCase());

        if (inputValue === "") {
            this.showAndCreateModal("Input tidak boleh kosong");
            return;
        }

        const newActivity: Omit<Activity, 'id'> = {
            act_name: inputValue,
            created_at: new Date()
        }

        if (this.selectedActId === null) {
            if (!isExist) {
                await dataStorage.addToStorage(newActivity);
            } else {
                this.showAndCreateModal("Aktivitas sudah ada");
            }
        } else {
            await dataStorage.changeSelectedData(this.selectedActId as string, newActivity);
        }

        this.resetActivityForm();
    },

    createActivityComponent(act: Activity): HTMLDivElement {
        const activityComponent = document.createElement("div") as HTMLDivElement;
        activityComponent.className = "list-component";
        activityComponent.dataset.id = act.id.toString();

        const activityName = document.createElement("div") as HTMLDivElement;
        activityName.className = "activity-name";
        activityName.textContent = act.act_name;
        activityName.style.fontWeight = "600";

        const date = document.createElement("div") as HTMLDivElement;
        date.className = "created-at";
        date.textContent = `created at: ${act.created_at.toLocaleString()}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.textContent = "Select";
        selectBtn.className = "select-button";

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-button";

        buttonWrap.append(selectBtn, deleteBtn);
        activityComponent.append(activityName, date, buttonWrap);

        return activityComponent;
    },

    selectActivity(id: string): void {
        this.selectedActId = id;
        const activityData = dataStorage.currentData.find(act => act.id === id);
        if (!activityData) return;

        activityName.value = activityData.act_name;
        submitButton.textContent = 'Edit Activity';
    },

    async deleteAct(id: string): Promise<void> {
        try {
            if (dataStorage.currentData.length > 0) {
                await dataStorage.deleteSelectedData(id);
                if (this.selectedActId === id) this.resetActivityForm();
            } else {
                activityList.innerHTML = '';
                activityList.textContent = "No activities yet...";
            }
        } catch (error) {
            this.showAndCreateModal(`Failed to delete data: ${error}`);
            this.teardownModal();
        }
    },

    async deleteAllActivities(): Promise<void> {
        try {
            if (dataStorage.currentData.length > 0) {
                await dataStorage.deleteAllData();
                this.resetActivityForm();
                activityList.innerHTML = '';
                activityList.textContent = "No activities yet...";
            } else {
                this.showAndCreateModal("Daftar aktivitas masih kosong!");
                this.teardownModal()
            } 
        } catch (error) {
            this.showAndCreateModal(`Failed to delete all data: ${error}`);
            this.teardownModal();
        }
    },

    resetActivityForm(): void {
        this.selectedActId = null;
        submitButton.textContent = 'Add Activity';
        activityForm.reset();
    },

    showAndCreateModal(message: string) {
        this.modal.className = "content";
        this.modalText.className = "message";
        this.modalText.textContent = message;
        this.modal.appendChild(this.modalText);
        this.modal.classList.add("show");
        notification.appendChild(this.modal);

        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    },

    teardownModal(): void {
        if (this.modal.parentElement) {
            this.modal.parentElement.removeChild(this.modal);
            this.modal.classList.remove("show");
        }
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
            this.modal.classList.remove("show");
        }
    },

    cleanupStorage(): void {
        dataStorage.teardownStorage();
    }
});

export default ActivityManagement;