import TableStorage from "./table-storage";
import Modal from "./modal";
import type { ListNode } from "./interfaces";

interface JobInfo {
    id: string;
    created_at: Date;
    job_name: string;
    job_description: string;
    job_priority: string; 
}

const PRIORITY_ORDER: { [key: string]: number } = {
    'trivial': 0,
    'optional': 1,
    'low': 2,
    'medium': 3,
    'high': 4,
    'urgent': 5,
    'immediate': 6,
    'critical': 7,
    'emergency': 8,
    'blocker': 9,
    'fatal': 10,
    'catastrophic': 11,
    'disaster': 12,
};

class JobPriority extends TableStorage<JobInfo> {
    private getSelectedId: string | null = null;
    private controller = new AbortController();
    private notification = document.getElementById("notification") as HTMLElement;
    private jobNotification = new Modal(this.notification);

    private jobForm = document.getElementById("job-form") as HTMLFormElement;
    private jobName = document.getElementById("job-name") as HTMLInputElement;
    private jobDescription = document.getElementById("job-description") as HTMLTextAreaElement;
    private jobPriority = document.getElementById("job-priority") as HTMLSelectElement; 
    private jobsList = document.getElementById("jobs-list") as HTMLElement;

    constructor() {
        super("job_priority");
    }
    
    async initEventListeners(): Promise<void> {
        await this.realtimeInit((data) => this.showAllJobs(data));

        this.jobForm.addEventListener("submit", async (event) => await this.insertJob(event), {
            signal: this.controller.signal
        }); 
    }

    private async insertJob(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedJobName = this.jobName.value.trim();
        const trimmedJobDescription = this.jobDescription.value.trim();
        const selectedPriority = this.jobPriority.value;

        if (!trimmedJobName || !trimmedJobDescription || !selectedPriority) {
            this.jobNotification.create("Please fill in all fields.");
            this.jobNotification.show();
            return;
        }

        try {
            await this.insertToDatabase({
                created_at: new Date(),
                job_name: trimmedJobName,
                job_description: trimmedJobDescription,
                job_priority: selectedPriority
            });
        } catch (error) {
            this.jobNotification.create(`Failed to add job: ${error}`);
            this.jobNotification.show();
        } finally {
            this.jobForm.reset();
        }
    }

    protected override addDataToNode(data: JobInfo): void {
        const newNode: ListNode<JobInfo> = {
            data,
            next: null,
            prev: null
        }

        this.currentData.set(data.id, newNode);

        // Jika linked list kosong
        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
            return;
        }

        const newNodePriority = PRIORITY_ORDER[data.job_priority] || 0;
        let current: ListNode<JobInfo> | null = this.head;

        // Traverse linked list
        while (current) {
            const currentPriorityValue = PRIORITY_ORDER[current.data.job_priority] || 0;

            if (newNodePriority < currentPriorityValue ||
                (newNodePriority === currentPriorityValue && 
                data.created_at < current.data.created_at)) {
                
                // Sisipkan node sebelum current node
                newNode.next = current;
                newNode.prev = current.prev;

                if (current.prev) {
                    current.prev.next = newNode;
                } else {
                    // Jika current adalah head, update head
                    this.head = newNode;
                }
                
                current.prev = newNode;
                return;
            }
            
            // Lanjut ke node berikutnya
            current = current.next;
        }

        // Jika sampai di sini, tambahkan di akhir
        if (this.tail) {
            this.tail.next = newNode;
            newNode.prev = this.tail;
        }
        this.tail = newNode;
    }

    showAllJobs(jobs: JobInfo[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (jobs.length > 0) {
                jobs.forEach(job => fragment.appendChild(this.createJobComponent(job)));
                this.jobsList.innerHTML = "";
                this.jobsList.appendChild(fragment);
            } else {
                this.jobsList.innerHTML = '<div class="empty-message">No jobs available.</div>';
            }
        } catch (error) {
            this.jobNotification.create(`Error displaying jobs: ${error}`);
            this.jobNotification.show();
            this.jobsList.innerHTML = '<div class="empty-message">No jobs available.</div>';
        }
    }

    private createJobComponent(detail: JobInfo): HTMLDivElement {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job-item";

        if (this.getSelectedId !== detail.id) {
            const jobName = document.createElement('h3') as HTMLHeadingElement;
            jobName.className = 'job-name';
            jobName.textContent = `Job Name: ${detail.job_name}`;

            const jobDescription = document.createElement('p') as HTMLParagraphElement;
            jobDescription.className = 'job-description';
            jobDescription.textContent = `Description: ${detail.job_description}`;

            const jobPriority = document.createElement('span') as HTMLSpanElement;
            jobPriority.className = 'job-priority';
            jobPriority.textContent = `Priority: ${detail.job_priority}`;

            const editButton = document.createElement('button') as HTMLButtonElement;
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.className = 'edit-button';
            editButton.onclick = () => {
                const previousId = this.getSelectedId;
                this.getSelectedId = detail.id;
                this.updateExistingComponent(detail.id);

                if (previousId && previousId !== detail.id) this.updateExistingComponent(previousId);
            }

            const deleteButton = document.createElement('button') as HTMLButtonElement;
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.onclick = async () => await this.removeJob(detail.id);

            const buttonsDiv = document.createElement('div') as HTMLDivElement;
            buttonsDiv.className = 'button-wrapper';
            buttonsDiv.append(editButton, deleteButton);
            
            jobDiv.append(jobName, jobDescription, jobPriority, buttonsDiv);
            jobDiv.dataset.id = detail.id;
        } else {
            const newJobName = document.createElement('input') as HTMLInputElement;
            newJobName.type = 'text';
            newJobName.value = detail.job_name;
            newJobName.className = 'new-job-name';

            const newJobDescription = document.createElement('input') as HTMLInputElement;
            newJobDescription.type = 'text';
            newJobDescription.value = detail.job_description;
            newJobDescription.className = 'new-job-description';

            const newJobPriority = document.createElement('select') as HTMLSelectElement;
            newJobPriority.className = 'new-job-priority';

            const priorities = [
                'low', 'medium', 'high', 'urgent', 'immediate', 'critical', 'emergency', 'blocker', 
                'fatal', 'catastrophic', 'disaster', 'trivial', 'optional'
            ];

            priorities.forEach(priority => {
                const option = document.createElement('option') as HTMLOptionElement;
                option.value = priority;
                option.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);

                if (priority === detail.job_priority) option.selected = true;
                newJobPriority.appendChild(option);
            });

            const saveButton = document.createElement('button') as HTMLButtonElement;
            saveButton.type = 'button';
            saveButton.textContent = 'Save';
            saveButton.className = 'save-button';
            saveButton.onclick = async () => {
                const updatedJobName = newJobName.value.trim();
                const updatedJobDescription = newJobDescription.value.trim();
                const updatedJobPriority = newJobPriority.value;

                if (!updatedJobName || !updatedJobDescription || !updatedJobPriority) {
                    this.jobNotification.create("Please fill in all fields.");
                    this.jobNotification.show();
                    return;
                }

                try {
                    await this.changeSelectedData(detail.id, {
                        job_name: updatedJobName,
                        job_description: updatedJobDescription,
                        job_priority: updatedJobPriority
                    });

                    this.getSelectedId = null;
                    this.updateExistingComponent(detail.id);
                } catch (error) {
                    this.jobNotification.create(`Failed to update job: ${error}`);
                    this.jobNotification.show();
                }
            }

            const cancelButton = document.createElement('button') as HTMLButtonElement;
            cancelButton.type = 'button';
            cancelButton.textContent = 'Cancel';
            cancelButton.className = 'cancel-button';
            cancelButton.onclick = () => {
                this.getSelectedId = null;
                this.updateExistingComponent(detail.id);
            }

            const buttonWrapper = document.createElement('div') as HTMLDivElement;
            buttonWrapper.className = 'button-wrapper';
            buttonWrapper.append(saveButton, cancelButton);

            jobDiv.append(newJobName, newJobDescription, newJobPriority, buttonWrapper);
        }
        return jobDiv;
    }

    async removeJob(id: string): Promise<void> {
        try {
            await this.deleteSelectedData(id);
            this.getSelectedId = null;
        } catch (error) {
            this.jobNotification.create(`Failed to remove job: ${error}`);
            this.jobNotification.show();
        }
    }

    async removeAllJobs(): Promise<void> {
        try {
            await this.removeAllData();
        } catch (error) {
            this.jobNotification.create(`Failed to remove all jobs: ${error}`);
            this.jobNotification.show();
        }
    }

    teardown(): void {
        this.controller.abort();
        this.jobNotification.teardown();
    }

    private updateExistingComponent(jobId: string): void {
        const jobDiv = this.jobsList.querySelector(`.job-item[data-id="${jobId}"]`);
        if (jobDiv) {
            const jobDetailNode = this.currentData.get(jobId);
            if (jobDetailNode) {
                const jobDetail = jobDetailNode.data;
                const newComponent = this.createJobComponent(jobDetail);
                newComponent.dataset.id = jobId;
                jobDiv.replaceWith(newComponent);
            } else {
                jobDiv.remove();
                if (this.linkedListToArray().length === 0) {
                    this.jobsList.innerHTML = '<div class="empty-message">No jobs available.</div>';
                }
            }
        } else {
            this.showAllJobs(this.linkedListToArray());
        }
    }
}

const jobPriority = new JobPriority();

function initJobPriority(): void {
    jobPriority.initEventListeners();
}

function teardownJobPriority(): void {
    jobPriority.teardown();
}

document.addEventListener("DOMContentLoaded", initJobPriority);
window.addEventListener("beforeunload", teardownJobPriority);