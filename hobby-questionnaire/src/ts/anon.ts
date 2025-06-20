import type { Human } from "./types";
import TableStorage from "./supabase-table";
import Notification from "./notification";

const tableStorage = TableStorage<Human>('hobbies_list');
const hobbyQuestionnaire = document.getElementById('hobby-questionnaire') as HTMLFormElement;
const humanName = document.getElementById('name') as HTMLInputElement;
const humanAge = document.getElementById('age') as HTMLInputElement;
const openHobbyQuestionnaire = document.getElementById('open-hobby-questionnaire') as HTMLButtonElement;
const closeHobbyQuestionnaire = document.getElementById('close-hobby-questionnaire') as HTMLButtonElement;
const notification = document.getElementById('anon-notification') as HTMLElement;
const anonNotification = Notification(notification);
const humanList = document.getElementById('human-list') as HTMLElement;

function AnonRole() {
    async function initAnonRole(): Promise<void> {
        hobbyQuestionnaire.onsubmit = async (event) => await insertNewHuman(event);
        openHobbyQuestionnaire.onclick = () => openInsertForm();
        closeHobbyQuestionnaire.onclick = () => hideInsertForm();
        await tableStorage.realtimeInit((humans) => showAllHumanId(humans));
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

    function showAllHumanId(humans: Human[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (tableStorage.currentData.size > 0) {
                humanList.innerHTML = '';
                humans.forEach(human => fragment.appendChild(humanIdDisplayer(human)));
                humanList.appendChild(fragment);
            } else {
                anonNotification.createNotification('No Human Added!');
                anonNotification.showNotification();
                humanList.innerHTML = '';
                humanList.textContent = 'No Human Added!';
            }
        } catch (error: any) {
            anonNotification.createNotification(`Error: ${error.message || error}`);
            anonNotification.showNotification();
            humanList.innerHTML = '';
            humanList.textContent = 'An Error Ocured!';
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
            anonNotification.createNotification('Missing required data!');
            anonNotification.showNotification();
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
            anonNotification.createNotification(`Error: ${error.message || error}`);
            anonNotification.showNotification();
        }
    }

    function humanIdDisplayer(identities: Human): HTMLDivElement {
        const humanIdCard = document.createElement('div') as HTMLDivElement;
        humanIdCard.className = 'bg-[#0C2D48] text-[#B1D4E0] p-[1rem] rounded-[1rem] flex flex-col gap-[0.5rem] border-[2px] border-[#2E8BC0] shadow-[4px_4px_#2E8BC0]';
        humanIdCard.dataset.id = identities.id;

        const name = document.createElement('div') as HTMLDivElement;
        name.className = 'human-name';
        name.textContent = `Name: ${identities.name}`;

        const gender = document.createElement('div') as HTMLDivElement;
        gender.className = 'human-gender';
        gender.textContent = `Gender: ${identities.gender}`;

        const hobby = document.createElement('div') as HTMLDivElement;
        hobby.className = 'human-hobby';
        hobby.textContent = `Hobby: ${identities.hobbies.join(', ')}`;
        
        const createdAt = document.createElement('div') as HTMLDivElement;
        createdAt.className = 'human-created-at';
        createdAt.textContent = `Created at: ${identities.created_at.toLocaleString()}`;

        humanIdCard.append(name, gender, hobby, createdAt);
        return humanIdCard;
    }

    function teradownAnon(): void {
        tableStorage.teardownTable();
        anonNotification.teardownNotification();
        hideInsertForm();
    }

    return { initAnonRole, teradownAnon }
}

const anonRole = AnonRole();

document.addEventListener('DOMContentLoaded', anonRole.initAnonRole);
window.addEventListener('beforeunload', anonRole.teradownAnon);