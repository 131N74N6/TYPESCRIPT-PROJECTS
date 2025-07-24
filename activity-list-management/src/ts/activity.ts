import TableStorage from './supabase-table';
import type { Activity } from './type-interface';

const tableStorage = TableStorage<Activity>('activity_list');
const controller: AbortController = new AbortController();
let selectedId: string | null = null;
let timeout: number | null = null;

const notification = document.getElementById("notification") as HTMLElement;
const activityForm = document.getElementById("activity-form") as HTMLFormElement;
const activityName = document.getElementById("activity-name") as HTMLTextAreaElement;
const activityList = document.getElementById("activity-list") as HTMLElement;
const submitButton = document.getElementById("submit-btn") as HTMLButtonElement;

function ActivityManagement() {
    const modal = document.createElement('div') as HTMLDivElement;
    const modalText = document.createElement('p') as HTMLParagraphElement;

    async function initEventListeners(): Promise<void> {
        await tableStorage.realtimeInit((data) => showAllActivities(data));

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#delete-all-button')) deleteAllActivities();
            else if (target.closest('#reset-form-btn')) resetActivityForm();
        }, { signal: controller.signal });

        activityList.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            const listComponents = target.closest('.list-component') as HTMLElement | null;
            if (!listComponents) return; 

            const fileId = listComponents.dataset.id;
            if (!fileId || fileId === null) {
                showAndCreateModal('File ID not found or invalid on clicked card.');
                teardownModal();
                return;
            }

            if (target.closest('#select-button')) {
                selectActivity(fileId);
            } else if (target.closest('#delete-button')) {
                await deleteAct(fileId);
            }
        }, { signal: controller.signal });

        activityForm.addEventListener('submit', (event) => submitActivity(event), { 
            signal: controller.signal 
        });
    }

    async function showAllActivities(activities: Activity[]): Promise<void> {
        try{
            const activityFragment = document.createDocumentFragment();;
            if (activities.length > 0) {
                activityList.innerHTML = '';
                activities.forEach(act => activityFragment.appendChild(
                    createActivityComponent(act)
                ));
                activityList.appendChild(activityFragment);
            } else {
                activityList.innerHTML = '';
                activityList.textContent = 'No activities yet...';
            }
        } catch(error) {
            showAndCreateModal(`Failed to show data: ${error}`);
            teardownModal();
            activityList.innerHTML = '';
            activityList.textContent = 'No activities yet...';
        }
    }

    async function submitActivity(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const inputValue = activityName.value.trim();
        const isExist = tableStorage.toArray()
        .some(act => act.act_name.toLowerCase() === inputValue.toLowerCase());

        if (inputValue === '') {
            showAndCreateModal('Input tidak boleh kosong');
            return;
        }

        const newActivity = { act_name: inputValue }

        if (selectedId === null) {
            if (!isExist) {
                await tableStorage.insert(newActivity);
            } else {
                showAndCreateModal('Aktivitas sudah ada');
            }
        } else {
            await tableStorage.changeSelectedData(selectedId as string, newActivity);
        }

        resetActivityForm();
    }

    function createActivityComponent(act: Activity): HTMLDivElement {
        const activityComponent = document.createElement('div') as HTMLDivElement;
        activityComponent.className = 'list-component text-[#FA198B] bg-[#31081F] p-[1rem] bg-[#31081F] rounded-[1rem] border-[#6B0F1A] border-[1.8px] shadow-[4px_4px_#6B0F1A]';
        activityComponent.dataset.id = act.id.toString();

        const activityName = document.createElement('div') as HTMLDivElement;
        activityName.className = 'activity-name';
        activityName.textContent = act.act_name;
        activityName.style.fontWeight = '600';

        const date = document.createElement('div') as HTMLDivElement;
        date.className = 'created-at';
        date.textContent = `created at: ${act.created_at.toLocaleString()}`;

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.id = 'button-wrap';
        buttonWrap.className = 'flex gap-[1rem]';

        const selectBtn = document.createElement('button') as HTMLButtonElement;
        selectBtn.type = 'button';
        selectBtn.className = 'bg-[#B91372] text-[#31081F] shadow-[3px_3px_#FA198B] cursor-pointer p-[0.4rem] rounded-[0.4rem]';
        selectBtn.textContent = 'Select';
        selectBtn.id = 'select-button';

        const deleteBtn = document.createElement('button') as HTMLButtonElement;
        deleteBtn.type = 'button';
        deleteBtn.className = 'bg-[#B91372] text-[#31081F] shadow-[3px_3px_#FA198B] cursor-pointer p-[0.4rem] rounded-[0.4rem]';
        deleteBtn.textContent = 'Delete';
        deleteBtn.id = 'delete-button';

        buttonWrap.append(selectBtn, deleteBtn);
        activityComponent.append(activityName, date, buttonWrap);

        return activityComponent;
    }

    function selectActivity(id: string): void {
        selectedId = id;
        const activityData = tableStorage.currentData.get(id);
        if (!activityData) return;

        activityName.value = activityData.act_name;
        submitButton.textContent = 'Edit Activity';
    }

    async function deleteAct(id: string): Promise<void> {
        try {
            if (tableStorage.currentData.size > 0) {
                await tableStorage.deleteSelectedData(id);
                if (selectedId === id) resetActivityForm();
            } else {
                activityList.innerHTML = '';
                activityList.textContent = 'No activities yet...';
            }
        } catch (error) {
            showAndCreateModal(`Failed to delete data: ${error}`);
            teardownModal();
        }
    }

    async function deleteAllActivities(): Promise<void> {
        try {
            if (tableStorage.currentData.size > 0) {
                await tableStorage.deleteAllData();
                resetActivityForm();
                activityList.innerHTML = '';
                activityList.textContent = 'No activities yet...';
            } else {
                showAndCreateModal('Daftar aktivitas masih kosong!');
                teardownModal()
            } 
        } catch (error) {
            showAndCreateModal(`Failed to delete all data: ${error}`);
            teardownModal();
        }
    }

    function resetActivityForm(): void {
        selectedId = null;
        submitButton.textContent = 'Add Activity';
        activityForm.reset();
    }

    function showAndCreateModal(message: string) {
        modal.className = 'content';
        modalText.className = 'message';
        modalText.textContent = message;
        modal.appendChild(modalText);
        modal.classList.add('show');
        notification.appendChild(modal);

        timeout = window.setTimeout(() => teardownModal(), 3000);
    }

    function teardownModal(): void {
        if (modal.parentElement) {
            modal.parentElement.removeChild(modal);
            modal.classList.remove('show');
        }
        
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            modal.classList.remove('show');
        }
    }

    function cleanupStorage(): void {
        tableStorage.teardownStorage();
    }

    return {
        cleanupStorage,
        initEventListeners,
        resetActivityForm,
        teardownModal,
    }
}
const activityManagement = ActivityManagement();

function teardownActivity(): void {
    controller.abort();
    activityManagement.teardownModal();
    activityManagement.resetActivityForm();
    activityManagement.cleanupStorage();
}

document.addEventListener("DOMContentLoaded", activityManagement.initEventListeners);
window.addEventListener("beforeunload", teardownActivity);