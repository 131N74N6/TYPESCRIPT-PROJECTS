import TableStorage from "./table-storage";
import Modal from "./modal";

type Info = {
    id: string;
    created_at: Date;
    data_name: string;
    detail_info: string[];
}

const dataStorage = TableStorage<Info>('dynamic_input');
const controller = new AbortController();
const notification = document.getElementById('notification') as HTMLElement;
let getSelectedId: string | null = null;

const inputSection = document.getElementById('input-section') as HTMLFormElement;
const nameInput = document.getElementById('name-input') as HTMLInputElement;
const dynamicFields = document.getElementById('dynamic-fields') as HTMLDivElement;

const dynamicInputNotification = Modal(notification);
const searchSection = document.getElementById('search-section') as HTMLFormElement;
const searchData = document.getElementById('search-data') as HTMLInputElement;
const itemsList = document.getElementById('items-list') as HTMLElement;

const queueDynamicInput = () => ({
    async initEventListeners(): Promise<void> {
        await dataStorage.realtimeInit((data) => this.showAllExistingData(data));

        inputSection.addEventListener('submit', async(event) => this.addNewData(event), {
            signal: controller.signal
        });

        searchSection.addEventListener('submit', (event) => this.handleSearchFilter(event), {
            signal: controller.signal
        });

        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#add-field-button')) this.addNewInputField();
            else if (target.closest('#clear-add-form')) this.resetform();
            else if (target.closest('#dequeue-data')) await this.dequeueExistingData();
            else if (target.closest('#delete-all')) await this.clearAllData();
        }, { signal: controller.signal });
    },

    createInputField(value?: string): HTMLInputElement {
        const input = document.createElement('input') as HTMLInputElement;
        input.type = 'text';
        input.className = 'additional-input';
        input.placeholder = 'enter additional detail';
        if (value) input.value = value;
        return input;
    },

    addNewInputField(): void {
        dynamicFields.appendChild(this.createInputField());
    },

    showAllExistingData(existedData: Info[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (existedData.length > 0) {
                existedData.forEach(data => fragment.appendChild(this.createComponent(data)));
                itemsList.innerHTML = '';
                itemsList.appendChild(fragment);
            } else {
                itemsList.innerHTML = '';
                itemsList.textContent = 'No Data Added Yet';
            }
        } catch (error) {
            dynamicInputNotification.createComponent(`Failed to load data: ${error}`);
            dynamicInputNotification.showComponent();
            itemsList.innerHTML = '';
            itemsList.textContent = 'No Data Added Yet';
        }
    },

    async addNewData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = nameInput.value.trim();
        const getAdditionalInput = Array.from(
            document.querySelectorAll<HTMLInputElement>('#dynamic-fields input'))
        .map(data => data.value)
        .filter(dt => dt);

        const getAllData = dataStorage.toArray();
        const isExsist = getAllData.some(data => data.data_name.toLowerCase() === trimmedValue.toLowerCase());

        if (trimmedValue === '' || !trimmedValue) {
            dynamicInputNotification.createComponent('Missing required data');
            dynamicInputNotification.showComponent();
            return;
        }

        if (isExsist && getSelectedId === null) {
            dynamicInputNotification.createComponent('Data already exist');
            dynamicInputNotification.showComponent();
            return;
        }

        try {
            await dataStorage.addQueue({
                created_at: new Date(),
                data_name: trimmedValue,
                detail_info: getAdditionalInput
            });
        } catch (error) {
            dynamicInputNotification.createComponent(`Failed to add data: ${error}`);
            dynamicInputNotification.showComponent();
        } finally {
            this.resetform();
        }
    },

    handleSearchFilter(event: SubmitEvent): void {
        event.preventDefault();
        const trimmedSearch = searchData.value.trim().toLowerCase();
        const existedData = dataStorage.toArray();;

        if (trimmedSearch === '') {
            dynamicInputNotification.createComponent('Missing required data');
            dynamicInputNotification.showComponent();
            return;
        }

        const filtered = existedData
        .filter(data => data.data_name.toLowerCase().includes(trimmedSearch));

        this.showFilteredData(filtered);
    },

    showFilteredData(filtered: Info[]): void {
        const fragment = document.createDocumentFragment();
        itemsList.innerHTML = '';

        filtered.forEach(data => fragment.appendChild(this.createComponent(data)));
        itemsList.appendChild(fragment);
    },

    createComponent(detail: Info): HTMLDivElement {
        const card = document.createElement('div') as HTMLDivElement;
        card.className = 'card';
        card.dataset.id = detail.id;

        if (getSelectedId === detail.id) {
            const newDataName = document.createElement('input') as HTMLInputElement;
            newDataName.type = 'text';
            newDataName.value = detail.data_name;
            newDataName.placeholder = 'enter new data name...'
            newDataName.className = 'new-data-name';

            const newDetailInfo = document.createElement('div') as HTMLDivElement;
            newDetailInfo.className = 'new-detail-info';

            detail.detail_info.forEach((info) => {
                newDetailInfo.appendChild(this.createInputField(info));
            });

            const buttonWrapForEdit = document.createElement('div') as HTMLDivElement;
            buttonWrapForEdit.className = 'button-wrap';

            const addInputField = document.createElement('button') as HTMLButtonElement;
            addInputField.type = 'button';
            addInputField.className = 'add-input-field-button';
            addInputField.textContent = '+';
            addInputField.onclick = () => newDetailInfo.appendChild(this.createInputField());

            const changeButton = document.createElement('button') as HTMLButtonElement;
            changeButton.className = 'change-button';
            changeButton.textContent = 'Change';
            changeButton.onclick = async () => {
                const newTrimmedValue = newDataName.value.trim();

                if (newTrimmedValue === '') {
                    dynamicInputNotification.createComponent('Missing required data!');
                    dynamicInputNotification.showComponent();
                    return;
                }

                const inputs = newDetailInfo.querySelectorAll('input');
                const getNewAdditionalInput = Array.from(inputs).map(input => 
                    input.value.trim()
                ).filter(Boolean);

                try {
                    await dataStorage.changedSelectedData(detail.id, {
                        created_at: detail.created_at, 
                        data_name: newTrimmedValue,
                        detail_info: getNewAdditionalInput
                    });
                    getSelectedId = null;
                    this.updateExistingComponent(detail.id); // Render ulang hanya item ini
                } catch (error) {
                    dynamicInputNotification.createComponent(`Failed to change data: ${error}`);
                    dynamicInputNotification.showComponent();
                }
            }

            const cancelButton = document.createElement('button') as HTMLButtonElement;
            cancelButton.className = 'cancel-button';
            cancelButton.textContent = 'Cancel';
            cancelButton.onclick = () => {
                getSelectedId = null;
                this.updateExistingComponent(detail.id); // Render ulang hanya item ini
            }

            buttonWrapForEdit.append(changeButton, addInputField, cancelButton);
            card.append(newDataName, newDetailInfo, buttonWrapForEdit);
        } else {
            const dataName = document.createElement('p') as HTMLParagraphElement;
            dataName.textContent = detail.data_name;
            dataName.className = 'data-name';

            const detailInfo = document.createElement('div') as HTMLDivElement;
            detailInfo.className = 'detail-info';

            detail.detail_info.forEach((info) => {
                const additionalInfo = document.createElement('div') as HTMLDivElement;
                additionalInfo.className = `info`;
                additionalInfo.textContent = `-) ${info}`;
                detailInfo.appendChild(additionalInfo);
            });

            const createdAt = document.createElement('p') as HTMLParagraphElement;
            createdAt.className = 'created-at';
            createdAt.textContent = `added at: ${detail.created_at.toLocaleString()}`;

            const buttonWrap = document.createElement('div') as HTMLDivElement;
            buttonWrap.className = 'button-wrap';

            const selectButton = document.createElement('button') as HTMLButtonElement;
            selectButton.type = 'button';
            selectButton.className = 'select-button';
            selectButton.textContent = 'Select';
            selectButton.onclick = () => {
                const previousSelectedId = getSelectedId;
                getSelectedId = detail.id;

                // Perbarui komponen yang baru saja dipilih
                this.updateExistingComponent(detail.id);

                // Jika ada item lain yang sebelumnya dalam mode edit,
                // kembalikan item tersebut ke mode tampilan normal
                if (previousSelectedId && previousSelectedId !== detail.id) {
                    this.updateExistingComponent(previousSelectedId);
                }
            }

            buttonWrap.append(selectButton);
            card.append(dataName, detailInfo, createdAt, buttonWrap);
        }

        return card;
    },

    updateExistingComponent(detailId: string): void {
        const existingComponent = itemsList.querySelector(`.card[data-id="${detailId}"]`);
        if (existingComponent) {
            const detail = dataStorage.currentData.get(detailId); // Dapatkan detail terbaru dari storage
            if (detail) {
                const newComponent = this.createComponent(detail);
                newComponent.dataset.id = detail.id; // Pastikan data-id ada
                existingComponent.replaceWith(newComponent); // Ganti komponen lama dengan yang baru
            } else {
                // Jika detail tidak ditemukan (mungkin sudah dihapus), hapus elemen
                existingComponent.remove();
                // Optional: Periksa apakah daftar kosong setelah penghapusan
                if (dataStorage.currentData.size === 0) {
                    itemsList.innerHTML = '';
                    itemsList.textContent = 'No Data Added Yet';
                }
            }
        } else {
            // Ini adalah fallback. Idealnya, jika realtimeInit sudah benar,
            // ini jarang dipanggil kecuali untuk item baru yang tidak tertangkap
            // atau jika ada masalah sinkronisasi.
            this.showAllExistingData(dataStorage.toArray());
        }
    },

    async dequeueExistingData(): Promise<void> {
        try {
            const data = dataStorage.toArray();
            if (data.length > 0) await dataStorage.dequeue();
            else {
                dynamicInputNotification.createComponent('No Data Added Yet');
                dynamicInputNotification.showComponent();
            }
        } catch (error) {
            dynamicInputNotification.createComponent(`Failed to dequeue: ${error}`);
            dynamicInputNotification.showComponent();
        }
    },

    async clearAllData(): Promise<void> {
        try {
            const data = dataStorage.toArray();
            if (data.length > 0) {
                await dataStorage.clearQueue();
                itemsList.innerHTML = '';
                itemsList.textContent = 'No Data Added Yet';
            } else {
                dynamicInputNotification.createComponent('No Data Added Yet');
                dynamicInputNotification.showComponent();
            }
        } catch (error) {
            dynamicInputNotification.createComponent(`Failed to clear queue: ${error}`);
            dynamicInputNotification.showComponent();
        }
    },

    teardown(): void {
        dataStorage.teardownTable();
        dynamicInputNotification.teardownComponent();
    },

    resetform(): void {
        inputSection.reset();
        Array.from(document.querySelectorAll<HTMLInputElement>('#dynamic-fields input'))
        .forEach(data => data.remove());
        getSelectedId = null;
    }
});

async function initQueueDynamicInput(): Promise<void> {
    await queueDynamicInput().initEventListeners();
}

function teardownQueueDynamicInput(): void {
    queueDynamicInput().teardown();
}

document.addEventListener('DOMContentLoaded', initQueueDynamicInput);
window.addEventListener('beforeunload', teardownQueueDynamicInput);