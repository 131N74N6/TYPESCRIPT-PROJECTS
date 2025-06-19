import TableStorage from "./supabase-table";
import Notification from "./notification";
import type { Human } from "./types";

// const controller = new AbortController();
const tableStorage = TableStorage<Human>('hobbies_list');
const hobbyQuestionnaire = document.getElementById('hobby-questionnaire') as HTMLFormElement;
const humanName = document.getElementById('name') as HTMLInputElement;

const hobbyFilter = document.getElementById('hobby-filter') as HTMLFormElement;
const searchedName = document.getElementById('searched-name') as HTMLInputElement;

const deleteAllButton = document.getElementById('delete-all-data') as HTMLButtonElement;
const humanList = document.getElementById('human-list') as HTMLElement;

const notification = document.getElementById('admin-notification') as HTMLElement;
const adminNotification = Notification(notification);

function AdminRole() {
    async function initAdminRole(): Promise<void> {
        hobbyQuestionnaire.onsubmit = async (event) => await insertNewHuman(event);
        deleteAllButton.onclick = async () => await deleteAllHuman();
        hobbyFilter.onsubmit = async (event) => await searchHuman(event);
        await tableStorage.realtimeInit((humans) => showAllHumanId(humans));
    }

    function showAllHumanId(humans: Human[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (tableStorage.currentData.size > 0) {
                humanList.innerHTML = '';
                humans.forEach(human => fragment.appendChild(humanIdDisplayer(human)));
                humanList.appendChild(fragment);
            } else {
                adminNotification.createNotification('No Human Added!');
                adminNotification.showNotification();
                humanList.innerHTML = '';
                humanList.textContent = 'No Human Added!';
            }
        } catch (error: any) {
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
            humanList.innerHTML = '';
            humanList.textContent = 'An Error Ocured!';
        }
    }

    async function insertNewHuman(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedHumanName = humanName.value.trim();
        const selectedGender = document.querySelector('input[name="gender"]:checked') as HTMLInputElement;
        const humanGender = selectedGender.value;
        const selectedHobby = document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]: checked');
        const humanHobby = Array.from(selectedHobby).map(hobby => hobby.value);

        await tableStorage.insertData({
            created_at: new Date(),
            name: trimmedHumanName,
            gender: humanGender,
            hobbies: humanHobby
        });
    }

    function humanIdDisplayer(identities: Human): HTMLDivElement {
        const humanIdCard = document.createElement('div') as HTMLDivElement;
        humanIdCard.dataset.id = identities.id;

        const name = document.createElement('div') as HTMLDivElement;
        name.id = `human-name-${identities.id}`;
        name.textContent = `Name: ${identities.name}`;

        const gender = document.createElement('div') as HTMLDivElement;
        gender.id = `human-gender-${identities.id}`;
        gender.textContent = `Gender: ${identities.gender}`;

        const hobby = document.createElement('div') as HTMLDivElement;
        hobby.id = `human-hobby-${identities.id}`;
        hobby.textContent = `Hobby: ${identities.hobbies.join(', ')}`;
        
        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.id = `human-created-at-${identities.id}`;
        createdAt.textContent = `Created at: ${identities.created_at.toLocaleString()}`;

        humanIdCard.append(name, gender, hobby, createdAt);
        return humanIdCard;
    }

    async function searchHuman(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        searchedName.value.trim();
    }

    async function deleteAllHuman(): Promise<void> {
        try {
            if (tableStorage.currentData.size > 0) {
                await tableStorage.deleteData();
                humanList.innerHTML = '';
                humanList.textContent = 'No Human Added!';
            } else {
                adminNotification.createNotification('No Human Added!');
                adminNotification.showNotification();
            }
        } catch (error: any) {
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
        }
    }

    return { initAdminRole }
}

const adminRole = AdminRole();

document.addEventListener('DOMContentLoaded', adminRole.initAdminRole);