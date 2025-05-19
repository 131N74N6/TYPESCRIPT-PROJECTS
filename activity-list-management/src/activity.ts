import StorageManager from "./storage";

type Activity = {
    id: string;
    act_name: string;
    created_at: Date;
}

const dataStorage = StorageManager<Activity>("activity list");

const ActivityManagement = async (
    notification: HTMLElement, activityForm: HTMLFormElement, activityList: HTMLElement, 
    activityName: HTMLTextAreaElement, submitButton: HTMLButtonElement
) => ({
    controller: new AbortController() as AbortController,
    getAllActivities: await dataStorage.loadFromStorage(),
    selectedActId: null as string | null,
    timeout: null as number | null,
    modal: document.createElement("div") as HTMLDivElement,
    modalText: document.createElement("p") as HTMLParagraphElement,

    eventListeners(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (target.closest("#delete-all")) this.deleteAllActivities();
            if (target.closest("#reset-form")) this.resetActivityForm();
        }, { signal: this.controller.signal });

        activityForm.addEventListener("submit", (event) => this.submitActivity(event), { 
            signal: this.controller.signal 
        });
    },

    showAllActivities(): void {
        const activityFragment = document.createDocumentFragment();

        if (this.getAllActivities.length > 0) {
            this.getAllActivities.forEach(act => activityFragment.appendChild(
                this.createActivityComponent(act)
            ));
        } else {
            const empty = document.createElement("div") as HTMLDivElement;
            empty.className = "empty-list";
            
            const message = document.createElement("div");
            message.className = "message";
            message.textContent = "....Daftar aktifitas kosong....";

            empty.appendChild(message);
            activityFragment.appendChild(empty);
        }

        activityList.innerHTML = '';
        activityList.appendChild(activityFragment);
    },

    async submitActivity(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const inputValue = activityName.value.trim();
        const isExist = this.getAllActivities.some(
            act => act.act_name.toLowerCase() === inputValue.toLowerCase()
        );

        if (!inputValue) {
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

        this.showAllActivities();
        this.resetActivityForm();
    },

    createActivityComponent(act: Activity): HTMLDivElement {
        const activityComponent = document.createElement("div") as HTMLDivElement;
        activityComponent.className = "list-component";

        const activityName = document.createElement("div") as HTMLDivElement;
        activityName.className = "activity-name";
        activityName.textContent = act.act_name;
        activityName.style.fontWeight = "600";

        const date = document.createElement("div") as HTMLDivElement;
        date.className = "created-at";
        date.textContent = `created at: ${act.created_at}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.textContent = "Select";
        selectBtn.className = "select-btn";
        selectBtn.addEventListener('click', () => this.selectActivity(act.id), { 
            signal: this.controller.signal 
        });

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener('click', () => this.deleteAct(act.id), { 
            signal: this.controller.signal 
        });

        buttonWrap.append(selectBtn, deleteBtn);
        activityComponent.append(activityName, date, buttonWrap);

        return activityComponent;
    },

    async selectActivity(id: string) {
        this.selectedActId = id;
        const activityData = this.getAllActivities.find(act => act.id === id);
        if (!activityData) return;

        activityName.value = activityData.act_name;
        submitButton.textContent = 'Edit Activity';
    },

    async deleteAct(id: string): Promise<void> {
        await dataStorage.deleteSelectedData(id);

        if (this.selectedActId === id) this.resetActivityForm();

        this.showAllActivities();
    },

    async deleteAllActivities(): Promise<void> {
        if (this.getAllActivities.length > 0) {
            await dataStorage.deleteAllData();
            activityList.replaceChildren();
            this.resetActivityForm();
        } else {
            this.showAndCreateModal("Daftar aktivitas masih kosong!");
        }
        this.showAllActivities();
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
        notification.appendChild(this.modal);

        this.timeout = window.setTimeout(() => this.teardownModal(), 3000);
    },

    teardownModal(): void {
        if (this.modal.parentElement) {
            this.modal.parentElement.removeChild(this.modal);
        }
        
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
});

export default ActivityManagement;