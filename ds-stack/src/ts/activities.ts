import Modal from "./modal";
import TableStorage from "./storage";
import type { Activity } from "./interface";

class ActivityStack extends TableStorage<Activity> {
    private controller = new AbortController();
    private getSelcetedId: string | null = null;
    private actInputFiled = document.getElementById("act-input-filed") as HTMLFormElement;
    private activityInput = document.getElementById("act-input") as HTMLInputElement;
    private activities = document.getElementById("activity-stack") as HTMLElement;
    private notification = document.getElementById("notification") as HTMLElement;
    private submitButton = document.getElementById("submit-button") as HTMLButtonElement;
    private actNotification = new Modal(this.notification);

    constructor() {
        super("activity_list"); 
    }

    async initEventListeners(): Promise<void> {
        await this.realtimeInit((data) => this.showAllActivities(data));

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all")) await this.clearActivities();
            else if (target.closest("#pop-stack")) await this.popActivity();
            else if (target.closest("#reset-form")) this.resetactForm();
        }, { signal: this.controller.signal });

        this.actInputFiled.addEventListener("submit", async (event) => this.addActivity(event), {
            signal: this.controller.signal
        });

        this.activities.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains('select-button')) {
                const activityWrap = target.closest('.activity-wrap') as HTMLDivElement;
                if (activityWrap) {
                    const id = activityWrap.dataset.id; // Pastikan card memiliki data-id
                    if (id) {
                        this.selectedActivity(id);
                    }
                }
            }
        }, { signal: this.controller.signal });
    }

    showAllActivities(activity: Activity[]): void {
        const fragment = document.createDocumentFragment();
        const activityData = activity.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

        try {
            if (activityData.length > 0) {
                activityData.forEach(data => fragment.appendChild(this.createActComponent(data)));
                this.activities.innerHTML = ''; 
                this.activities.appendChild(fragment);
            } else {
                this.activities.innerHTML = '';
                this.activities.textContent = 'No Activity Added!';
            }
        } catch (error) {
            this.actNotification.createModal(`Failed to load data: ${error}`);
            this.actNotification.showModal();
            this.activities.innerHTML = '';
            this.activities.textContent = 'No Activity Added!';
        }
    }

    async addActivity(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = this.activityInput.value.trim();
        const getAllAct = Array.from(this.currentData.values());
        const isExist = getAllAct.some(act => act.act_name.toLowerCase() === trimmedValue.toLowerCase());

        try {
            if (trimmedValue === "" || !trimmedValue) {
                this.actNotification.createModal("Enter required data!");
                this.actNotification.showModal();
                return;
            }

            if (isExist) {
                this.actNotification.createModal("Activity already exist!");
                this.actNotification.showModal();
                return;
            }

            if (this.getSelcetedId === null) {
                await this.push({ act_name: trimmedValue, created_at: new Date() });
            } else {
                await this.changeSelectedData(this.getSelcetedId, { act_name: trimmedValue });
            }
        } catch (error: any) {
            this.actNotification.createModal(`Failed to add activity: ${error.message || error}`);
            this.actNotification.showModal();
        } finally {
            this.resetactForm();
        }
    }

    private async popActivity(): Promise<void> {
        const activityData = Array.from(this.currentData.values());
        try {
            if (activityData.length > 0) await this.pop();
            else { 
                this.actNotification.createModal("Empty!");
                this.actNotification.showModal();
            }
        } catch (error: any) {
            this.actNotification.createModal(`Failed to delete activity: ${error.message || error}`);
            this.actNotification.showModal();
        }
    }

    private selectedActivity(id: string): void {
        this.getSelcetedId = id;
        const data = Array.from(this.currentData.values());
        const activity = data.find(dt => dt.id === this.getSelcetedId);

        if (!activity) return;

        this.activityInput.value = activity.act_name;
        this.submitButton.textContent = 'Save Change';
    }

    private createActComponent(detail: Activity): HTMLDivElement {
        const div = document.createElement("div") as HTMLDivElement;
        div.className = "activity-wrap";
        div.dataset.id = detail.id; 

        const activityName = document.createElement("p") as HTMLParagraphElement;
        activityName.className = "activity-name";
        activityName.textContent = `Aktivitas: ${detail.act_name}`;

        const createdAt = document.createElement("p") as HTMLParagraphElement;
        createdAt.className = "created-at";
        createdAt.textContent = `Dibuat pada: ${detail.created_at.toLocaleString()}`;

        const selectButton = document.createElement("button") as HTMLButtonElement;
        selectButton.className = 'select-button';
        selectButton.type = 'button';
        selectButton.textContent = 'Select';

        div.append(activityName, createdAt, selectButton);
        return div;
    }

    async clearActivities(): Promise<void> {
        try {
            await this.clear(); 
            this.activities.innerHTML = '';
            this.activities.textContent = 'No Activity Added!';
        } catch (error: any) {
            this.actNotification.createModal(`Error clearing activities: ${error.message || error}`);
            this.actNotification.showModal();
        }
    }

    resetactForm(): void {
        this.actInputFiled.reset();
        this.getSelcetedId = null;
        this.submitButton.textContent = 'Add +';
    }
}

const activityStack = new ActivityStack();

async function initActivityStack(): Promise<void> {
    await activityStack.initEventListeners();
}

function teardownActivityStack(): void {
    activityStack.teardownTable(); 
    activityStack.resetactForm();
}

document.addEventListener("DOMContentLoaded", initActivityStack);
window.addEventListener("beforeunload", teardownActivityStack);