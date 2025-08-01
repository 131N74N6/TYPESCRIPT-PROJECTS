import TableStorage from "./supabase-table";
import Notification from "./notification";
import type { Human } from "./types";

const tableStorage = TableStorage<Human>('hobbies_list');
const hobbyQuestionnaire = document.getElementById('hobby-questionnaire') as HTMLFormElement;
const humanName = document.getElementById('name') as HTMLInputElement;
const humanAge = document.getElementById('age') as HTMLInputElement;
const openHobbyQuestionnaire = document.getElementById('open-hobby-questionnaire') as HTMLButtonElement;
const closeHobbyQuestionnaire = document.getElementById('close-hobby-questionnaire') as HTMLButtonElement;

const editHobbyQuestionnaire = document.getElementById('edit-hobby-questionnaire') as HTMLFormElement;
const newHumanName = document.getElementById('new-name') as HTMLInputElement;
const newHumanAge = document.getElementById('new-age') as HTMLInputElement;
const newMaleRadioButton = document.getElementById('new-Male') as HTMLInputElement;
const newFemaleRadioButton = document.getElementById('new-Female') as HTMLInputElement;
const getHobby = document.querySelectorAll<HTMLInputElement>('input[name="new-hobbies"]');
const closePlaceForEdit = document.getElementById('close-edit-hobby-questionnaire') as HTMLButtonElement;

let selectedId: string | null = null;
let temp: Human[] = [];
const searchedName = document.getElementById('searched-name') as HTMLInputElement;
const sortingMethod = document.getElementById('sorting-method') as HTMLSelectElement;

const deleteAllButton = document.getElementById('delete-all-data') as HTMLButtonElement;
const notification = document.getElementById('admin-notification') as HTMLElement;
const adminNotification = Notification(notification);
const humanList = document.getElementById('human-list') as HTMLElement;

function AdminRole() {
    async function initAdminRole(): Promise<void> {
        await tableStorage.realtimeInit((humans) => {
            showAllHumanId(humans);
            temp = humans;
        });

        hobbyQuestionnaire.onsubmit = async (event) => await insertNewHuman(event);
        editHobbyQuestionnaire.onsubmit = async (event) => changeHumanId(event);
        deleteAllButton.onclick = async () => await deleteAllHuman();
        searchedName.oninput = (event) => searchedFiles(event);
        
        openHobbyQuestionnaire.onclick = () => openInsertForm();
        closeHobbyQuestionnaire.onclick = () => hideInsertForm();
        closePlaceForEdit.onclick = () => hideEditForm();

        sortingMethod.onchange = (event: Event) => {
            const selected = event.target as HTMLInputElement;
            switch(selected.value) {
                case 'from-oldest': {
                    temp = [...temp].sort((a, b) => b.age - a.age);
                    showAllHumanId(temp);
                    break;
                }
                case 'from-youngest': {
                    temp = [...temp].sort((a, b) => a.age - b.age);
                    showAllHumanId(temp);
                    break;
                }
                case 'from-A-to-Z': {
                    temp = [...temp].sort((a, b) => a.name.localeCompare(b.name));
                    showAllHumanId(temp);
                    break;
                }
                case 'from-Z-to-A': {
                    temp = [...temp].sort((a, b) => b.name.localeCompare(a.name));
                    showAllHumanId(temp);
                    break;
                }
                default: {
                    showAllHumanId(tableStorage.toArray());
                    searchedName.value = '';
                    break;
                }
            }
        }
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
                humanList.innerHTML = `<div class="text-[2rem] text-[#B1D4E0] text-center">No Human Added!</div>`;
            }
        } catch (error: any) {
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
            humanList.innerHTML = `<div class="text-[2rem] text-[#B1D4E0] text-center">An Error Ocured!</div>`;
        }
    }

    async function insertNewHuman(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedHumanName = humanName.value.trim();
        const trimedHumanAge = Number(humanAge.value.trim());
        const selectedGender = document.querySelector('input[name="gender"]:checked') as HTMLInputElement;
        const humanGender = selectedGender.value;
        const selectedHobby = document.querySelectorAll<HTMLInputElement>('input[name="hobbies"]:checked');
        const humanHobby = Array.from(selectedHobby).map(hobby => hobby.value);

        if (trimmedHumanName === '' || isNaN(trimedHumanAge) || trimedHumanAge <= 6 || !selectedGender || !selectedHobby) {
            adminNotification.createNotification('Missing required data!');
            adminNotification.showNotification();
            return;
        }

        try {
            await tableStorage.insertData({
                created_at: new Date(),
                name: trimmedHumanName,
                age: trimedHumanAge,
                gender: humanGender,
                hobbies: humanHobby
            });
            hideInsertForm();
        } catch (error: any) {
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
        }
    }

    function humanIdDisplayer(identities: Human): HTMLDivElement {
        const humanIdCard = document.createElement('div') as HTMLDivElement;
        humanIdCard.className = 'bg-[#0C2D48] text-[#B1D4E0] p-[1rem] rounded-[1rem] flex flex-col gap-[0.5rem] border-[2px] border-[#2E8BC0] shadow-[4px_4px_#2E8BC0]';
        humanIdCard.dataset.id = identities.id;

        const name = document.createElement('div') as HTMLDivElement;
        name.className = 'human-name';
        name.textContent = `Name: ${identities.name} (${identities.age} yo)`;

        const gender = document.createElement('div') as HTMLDivElement;
        gender.className = 'human-gender';
        gender.textContent = `Gender: ${identities.gender}`;

        const hobby = document.createElement('div') as HTMLDivElement;
        hobby.className = 'human-hobby';
        hobby.textContent = `Hobby: ${identities.hobbies.join(', ')}`;
        
        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.className = 'human-created-at';
        createdAt.textContent = `Created at: ${identities.created_at.toLocaleString()}`;

        const changeButton = document.createElement('button') as HTMLButtonElement;
        changeButton.type = 'button';
        changeButton.className = 'border-[1.9px] border-[#2E8BC0] p-[0.4rem] text-[0.9rem] cursor-pointer rounded-[0.4rem] w-[80px] hover:bg-[#2E8BC0] hover:text-[#0C2D48] font-[500]';
        changeButton.textContent = 'Change';
        changeButton.onclick = () => {
            selectedId = identities.id;
            newHumanName.value = identities.name;
            newHumanAge.value = identities.age.toString();
            newMaleRadioButton.checked = (identities.gender === 'Male');
            newFemaleRadioButton.checked = (identities.gender === 'Female');
            getHobby.forEach(hobby => hobby.checked = identities.hobbies.includes(hobby.value));
            openEditForm();
        }

        const deleteButton = document.createElement('button') as HTMLButtonElement;
        deleteButton.type = 'button';
        deleteButton.className = 'border-[1.9px] border-[#2E8BC0] p-[0.4rem] text-[0.9rem] cursor-pointer rounded-[0.4rem] w-[80px] hover:bg-[#2E8BC0] hover:text-[#0C2D48] font-[500]';
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = async () => await tableStorage.deleteData(identities.id);

        const buttonWrap = document.createElement('div') as HTMLDivElement;
        buttonWrap.className = 'flex flex-row gap-[0.5rem]';
        buttonWrap.append(changeButton, deleteButton);

        humanIdCard.append(name, gender, hobby, createdAt, buttonWrap);
        return humanIdCard;
    }

    function searchedFiles(event: Event): void {
        event.preventDefault();
        const trimmedSearched = searchedName.value.trim().toLowerCase();
        temp = tableStorage.toArray().filter(human => human.name.toLowerCase().includes(trimmedSearched));
        showAllHumanId(temp);
    }

    function openInsertForm(): void {
        hobbyQuestionnaire.classList.remove('hidden');
        hobbyQuestionnaire.classList.add('flex');
    }

    function hideInsertForm(): void {
        hobbyQuestionnaire.classList.remove('flex');
        hobbyQuestionnaire.classList.add('hidden');
        hobbyQuestionnaire.reset();
    }

    async function changeHumanId(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedNewName = newHumanName.value.trim();
        const trimmedNewAge = Number(newHumanAge.value.trim());
        const changeGender = document.querySelector('input[name="new-gender"]:checked') as HTMLInputElement;
        const getNewGender = changeGender.value.trim();
        const changeHobby = document.querySelectorAll<HTMLInputElement>('input[name="new-hobbies"]:checked');
        const getNewHobby = Array.from(changeHobby).map(hobby => hobby.value);

        if (trimmedNewName === '' || isNaN(trimmedNewAge) || trimmedNewAge <= 6 || !changeGender || !changeHobby) {
            adminNotification.createNotification('Missing required data!');
            adminNotification.showNotification();
            return;
        }
        
        try {
            await tableStorage.changeData(selectedId as string, {
                name: trimmedNewName,
                age: trimmedNewAge,
                gender: getNewGender,
                hobbies: getNewHobby
            });
            hideEditForm();
            selectedId = null;
        } catch (error: any) {
            selectedId = null;
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
        }
    }

    function openEditForm(): void {
        editHobbyQuestionnaire.classList.remove('hidden');
        editHobbyQuestionnaire.classList.add('flex');
    }

    function hideEditForm(): void {
        editHobbyQuestionnaire.classList.remove('flex');
        editHobbyQuestionnaire.classList.add('hidden');
        editHobbyQuestionnaire.reset();
    }

    async function deleteAllHuman(): Promise<void> {
        try {
            if (tableStorage.currentData.size > 0) {
                await tableStorage.deleteData();
                humanList.innerHTML = `<div class="text-[2rem] text-[#B1D4E0] text-center">No Human Added!</div>`;
            } else {
                adminNotification.createNotification('No Human Added!');
                adminNotification.showNotification();
            }
        } catch (error: any) {
            adminNotification.createNotification(`Error: ${error.message || error}`);
            adminNotification.showNotification();
        }
    }

    function teradownAdmin(): void {
        temp = [];
        tableStorage.teardownTable();
        adminNotification.teardownNotification();
        hideInsertForm();
        hideEditForm();
        selectedId = null;
    }

    return { initAdminRole, teradownAdmin }
}

const adminRole = AdminRole();

document.addEventListener('DOMContentLoaded', adminRole.initAdminRole);
window.addEventListener('beforeunload', adminRole.teradownAdmin);