import TableStorage from "./table-storage";

interface JobInfo {
    id: string;
    created_at: Date;
    job_name: string;
    job_description: string;
    job_priority: string; // 'low', 'medium', 'high', 'urgent'
}

class JobPriority extends TableStorage<JobInfo> {
    private getSelectedId: string | null = null;

    constructor() {
        super("job_priority");
        this.realtimeInit((data) => this.showAllJobs(data));
    }

    async addJob(event: SubmitEvent): Promise<void> {
        event.preventDefault();
    }

    showAllJobs(jobs: JobInfo[]): void {
        if (jobs.length > 0) {
            const fragment = document.createDocumentFragment();
            jobs.forEach(job => fragment.appendChild(this.createJobComponent(job)));
        }
    }

    createJobComponent(detail: JobInfo): HTMLDivElement {
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
            
            jobDiv.append(jobName, jobDescription, jobPriority);
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

            jobDiv.append(newJobName, newJobDescription);
        }
        return jobDiv;
    }
}

export default JobPriority;