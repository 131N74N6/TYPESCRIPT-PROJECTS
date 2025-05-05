type Activity = {
    id: number;
    activity: string;
    createdAt: string;
}

const activityForm = document.getElementById("activity-form") as HTMLFormElement;
const toDoInput = document.getElementById("todo-name") as HTMLTextAreaElement;
const activityList = document.querySelector("#activity-list") as HTMLElement;
const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;
const notification = document.getElementById("notification") as HTMLElement;

let controller: AbortController = new AbortController();

const ActivityDataManager = {
    actList: [] as Activity[],

    loadFromStorage(): void {
        const data = localStorage.getItem("list-activity");
        this.actList = data ? JSON.parse(data) : [];
    },

    saveToStorage(): void {
        localStorage.setItem("list-activity", JSON.stringify(this.actList));
    },

    getAllData(): Activity[] {
        return [...this.actList];
    },

    addNewData(data: Omit<Activity, 'id'>): void {
        const newData = { id: Date.now(), ...data } as Activity;
        this.actList.push(newData);
        this.saveToStorage();
    },

    changeSelectedData(id: number, data: Partial<Activity>): void {
        const index = this.actList.findIndex(list => list.id === id);
        const newData = { ...this.actList[index], ...data } as Activity;
        this.actList[index] = newData;
        this.saveToStorage();
    },

    deleteSelectedData(id: number): void {
        const index = this.actList.findIndex(list => list.id === id);
        this.actList.splice(index, 1);
        this.saveToStorage();
    },

    deleteAllData(): void {
        this.actList = [];
        localStorage.removeItem("list-activity");
    }
}

function eventListeners(): void {
    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        const getAllAct = Array.from(document.querySelectorAll(".list-component"));

        const selectButton = target.closest(".select-btn");
        const deleteButton = target.closest(".delete-btn");

        const getSelectedComponent = selectButton?.closest(".list-component");
        const deleteOneComponent = deleteButton?.closest(".list-component");

        const getSelectedIndex = getAllAct.indexOf(getSelectedComponent as Element);
        const getIndexToRemove = getAllAct.indexOf(deleteOneComponent as Element);

        if (getSelectedIndex > -1) {
            const actData = ActivityDataManager.actList[getSelectedIndex];
            ActivityList.selectActivity(actData.id);
        }
        if (getIndexToRemove > -1) {
            const actData = ActivityDataManager.actList[getIndexToRemove];
            ActivityList.deleteAct(actData.id);
        }
        if (target.closest("#delete-all")) ActivityList.deleteAllActivities();
        if (target.closest("#reset-form")) ActivityList.resetActivityForm();
    }, { signal: controller.signal });

    activityForm.addEventListener("submit", (event) => ActivityList.submitActivity(event), { 
        signal: controller.signal 
    });
}

const ActivityList = {
    selectedActId: null as number | null,
    timeout: null as number | null,
    modal: document.createElement("div") as HTMLDivElement,
    modalText: document.createElement("p") as HTMLParagraphElement,

    showAllActivities(): void {
        const activityFragment = document.createDocumentFragment();
        const activityData = ActivityDataManager.getAllData();

        if (activityData.length > 0) {
            activityData.forEach(act => activityFragment.appendChild(this.createActivityComponent(act)));
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

    submitActivity(event: SubmitEvent): void {
        event.preventDefault();
        const inputValue = toDoInput.value.trim();
        const currentDate = new Date();
        const isExist = ActivityDataManager.actList.some(
            act => act.activity.toLowerCase() === inputValue.toLowerCase()
        );

        if (!inputValue) {
            this.showAndCreateModal("Input tidak boleh kosong");
            return;
        }

        const newActivity: Partial<Activity> = {
            activity: inputValue,
            createdAt: currentDate.toISOString().slice(0,10)
        }

        if (this.selectedActId === null) {
            if (!isExist) {
                ActivityDataManager.addNewData(newActivity as Omit<Activity, 'id'>);
            } else {
                this.showAndCreateModal("Aktivitas sudah ada");
            }
        } else {
            ActivityDataManager.changeSelectedData(this.selectedActId as number, newActivity);
        }

        this.showAllActivities();
        this.resetActivityForm();
    },

    createActivityComponent(act: Activity): HTMLDivElement {
        const activityComponent = document.createElement("div") as HTMLDivElement;
        activityComponent.className = "list-component";

        const activityName = document.createElement("div") as HTMLDivElement;
        activityName.className = "activity-name";
        activityName.textContent = act.activity;
        activityName.style.fontWeight = "600";

        const date = document.createElement("div") as HTMLDivElement;
        date.className = "created-at";
        date.textContent = `created at: ${act.createdAt}`;

        const buttonWrap = document.createElement("div") as HTMLDivElement;
        buttonWrap.className = "button-wrap";

        const selectBtn = document.createElement("button") as HTMLButtonElement;
        selectBtn.type = "button";
        selectBtn.textContent = "Select";
        selectBtn.className = "select-btn";

        const deleteBtn = document.createElement("button") as HTMLButtonElement;
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";

        buttonWrap.append(selectBtn, deleteBtn);
        activityComponent.append(activityName, date, buttonWrap);

        return activityComponent;
    },

    selectActivity(id: number): void {
        const activityData = ActivityDataManager.actList.find(act => act.id === id);
        if (!activityData) return;

        toDoInput.value = activityData.activity;
        
        this.selectedActId = id;
        submitButton.textContent = 'Edit Activity';
    },

    deleteAct(id: number): void {
        ActivityDataManager.deleteSelectedData(id);

        if (this.selectedActId === id) this.resetActivityForm();

        this.showAllActivities();
    },

    deleteAllActivities(): void {
        if (ActivityDataManager.actList.length > 0) {
            ActivityDataManager.deleteAllData();
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

        this.timeout = setTimeout(() => this.teardownModal(), 3000);
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
}

function init(): void {
    ActivityDataManager.loadFromStorage();
    ActivityList.showAllActivities();
    eventListeners();
}

function teardown(): void {
    controller.abort();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);