import TableStorage from "./storage";

interface Activity {
    id: string;
    created_at: Date;
    act_name: string;
}

class ActivityStack extends TableStorage<Activity> {
    private controller = new AbortController();
    private actInputFiled = document.getElementById("act-input-filed") as HTMLFormElement;
    private activityInput = document.getElementById("act-input") as HTMLInputElement;
    private activities = document.getElementById("activity-stack") as HTMLElement;

    constructor() {
        super("activity_list"); 
        this.realtimeInit(() => this.showAllActivities());
    }

    initEventListeners(): void {
        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all")) await this.clearActivities();
            else if (target.closest("#pop-stack")) await this.popActivity()
        }, { signal: this.controller.signal });

        this.actInputFiled.addEventListener("submit", async (event) => this.addActivity(event), {
            signal: this.controller.signal
        });
    }

    showAllActivities(): void {
        const fragment = document.createDocumentFragment();
        const activityData = Array.from(this.currentData.values())
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

        if (activityData.length > 0) {
            activityData.forEach(data => fragment.appendChild(this.createActComponent(data)));
            this.activities.innerHTML = ''; 
            this.activities.appendChild(fragment);
        } else {
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
                alert("Enter required data!");
                return;
            }

            if (isExist) {
                alert("Activity already exist!");
                this.actInputFiled.reset();
                return;
            }

            await this.push({ act_name: trimmedValue, created_at: new Date() });
            this.actInputFiled.reset(); 
        } catch (error: any) {
            alert(`Failed to add activity: ${error.message || error}`);
        }
    }

    private async popActivity(): Promise<void> {
        const activityData = Array.from(this.currentData.values());
        try {
            activityData.length > 0 ? await this.pop() : alert("Empty!");
        } catch (error: any) {
            alert(`Failed to delete activity: ${error.message || error}`);
        }
    }

    async editActivity(id: string, newName: string): Promise<void> {
        try {
            await this.changeSelectedData(id, { act_name: newName });
        } catch (error: any) {
            alert(`Failed to change: ${error.message || error}`);
        }
    }

    private createActComponent(detail: Activity): HTMLDivElement {
        const div = document.createElement("div") as HTMLDivElement;
        div.className = "activity-wrap";
        div.dataset.id = detail.id; 

        const activityName = document.createElement("p") as HTMLParagraphElement;
        activityName.className = "activity-name";
        activityName.textContent = detail.act_name;

        const createdAt = document.createElement("p") as HTMLParagraphElement;
        createdAt.className = "created-at";
        createdAt.textContent = `Dibuat pada: ${detail.created_at.toLocaleString()}`;

        div.append(activityName, createdAt);
        return div;
    }

    async clearActivities(): Promise<void> {
        try {
            await this.clear(); 
            this.activities.innerHTML = '';
            this.activities.textContent = 'No Activity Added!';
        } catch (error: any) {
            console.error("Error clearing activities:", error);
            alert(`Failed to delete all: ${error.message || error}`);
        }
    }
}

const activityStack = new ActivityStack();

function initActivityStack(): void {
    activityStack.initEventListeners();
}

function teardownActivityStack(): void {
    activityStack.teardown(); 
}

document.addEventListener("DOMContentLoaded", initActivityStack);
window.addEventListener("beforeunload", teardownActivityStack);