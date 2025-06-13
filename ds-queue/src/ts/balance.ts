import TableStorage from "./table-storage";
import Modal from "./modal";

type BalanceInfo = {
    id: string;
    created_at: Date;
    amount: number;
    description: string;
    type: string;
}

const dataStorage = TableStorage<BalanceInfo>('finance_list');
const controller = new AbortController();
const notification = document.getElementById('notification') as HTMLElement;

let getSelectedId: string | null = null;
let incomeTotal: number = 0;
let expenseTotal: number = 0;
let differenceTotal: number = 0;

const balanceNotification = Modal(notification);
const balanceInputField = document.getElementById('balance-input-field') as HTMLFormElement;
const balanceValue = document.getElementById('balance-value') as HTMLInputElement;
const description = document.getElementById('description') as HTMLInputElement;

const balanceList = document.getElementById('balance-list') as HTMLElement;
const income = document.querySelector('.income-total') as HTMLElement;
const expense = document.querySelector('.expense-total') as HTMLElement;
const difference = document.querySelector('.income_expense') as HTMLElement;

const balanceWithQueueDS = () => ({
    async initEventListeners(): Promise<void> {
        await dataStorage.realtimeInit((data) => this.showAllBalance(data));

        document.addEventListener('click', async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest('#dequeue-balance')) await this.dequeueBalanceData();
            else if (target.closest('#delete-all')) await this.removeAllBalance();
        }, { signal: controller.signal });

        balanceInputField.addEventListener('submit', async (event) => this.addNewBalance(event), {
            signal: controller.signal
        });
    },

    showAllBalance(balances: BalanceInfo[]): void {
        const fragment = document.createDocumentFragment();
        try {
            incomeTotal = 0;
            expenseTotal = 0;
            differenceTotal = 0;

            if (balances.length > 0) {
                balances.forEach(balance => {
                    if (balance.type === 'income') incomeTotal += balance.amount;
                    else if (balance.type === 'expense') expenseTotal += balance.amount;
                    fragment.appendChild(this.createComponent(balance));
                });
                balanceList.innerHTML = '';
                balanceList.appendChild(fragment);
                
                differenceTotal = incomeTotal - expenseTotal;
                income.textContent = `Income: Rp ${incomeTotal.toLocaleString()}`;
                expense.textContent = `Expense: Rp ${expenseTotal.toLocaleString()}`;
                difference.textContent = `Difference: Rp ${differenceTotal.toLocaleString()}`;
            } else {
                incomeTotal = 0;
                expenseTotal = 0;
                differenceTotal = 0;

                income.textContent = 'Rp: 0';
                expense.textContent = 'Rp: 0';
                difference.textContent = 'Rp: 0';

                balanceList.innerHTML = '';
                balanceList.textContent = 'No Balance Added Yet';
            }
        } catch (error) {
            balanceNotification.createComponent(`Failed to add balance: ${error}`);
            balanceNotification.showComponent();
            incomeTotal = 0;
            expenseTotal = 0;
            differenceTotal = 0;

            income.textContent = 'Rp: 0';
            expense.textContent = 'Rp: 0';
            difference.textContent = 'Rp: 0';

            balanceList.innerHTML = '';
            balanceList.textContent = 'No Balance Added Yet';
        }
    },

    async addNewBalance(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedAmount = Number(balanceValue.value.trim());
        const trimmedDesc = description.value.trim();
        const chosenTypeElement = document.querySelector('input[name="category"]:checked') as HTMLInputElement;

        if (isNaN(trimmedAmount) || trimmedAmount <= 0 || trimmedDesc === '' || !chosenTypeElement) {
            balanceNotification.createComponent('Missing required data');
            balanceNotification.showComponent();
            return;
        }

        try {
            await dataStorage.addQueue({
                created_at: new Date(),
                amount: trimmedAmount,
                type: chosenTypeElement.value,
                description: trimmedDesc
            });
        } catch (error) {
            balanceNotification.createComponent(`Failed to add data: ${error}`);
            balanceNotification.showComponent();
        } finally {
            balanceInputField.reset();
        }
    },

    createComponent(detail: BalanceInfo): HTMLDivElement {
        const balanceCard = document.createElement('div') as HTMLDivElement;
        balanceCard.className = 'balance-card';
        balanceCard.dataset.id = detail.id;

        if (getSelectedId !== detail.id) {
            const amount = document.createElement('div') as HTMLDivElement;
            amount.className = 'amount';
            amount.textContent = `Amount: Rp ${detail.amount}`;

            const amountType = document.createElement('div') as HTMLDivElement;
            amountType.className = 'amount-type';
            amountType.textContent = `Type: ${detail.type}`;

            const balanceDescription = document.createElement('div') as HTMLDivElement;
            balanceDescription.className = 'balance-description';
            balanceDescription.textContent = `Description: ${detail.description}`;

            const createdAt = document.createElement('div') as HTMLDivElement;
            createdAt.className = 'created-at';
            createdAt.textContent = `Created At: ${detail.created_at.toLocaleString()}`;

            const selectButton = document.createElement('button') as HTMLButtonElement;
            selectButton.className = 'select-button';
            selectButton.textContent = 'Select';
            selectButton.type = 'button';
            selectButton.onclick = (): void => {
                const previousSelectedId = getSelectedId;
                getSelectedId = detail.id;
                this.updateExistingComponent(detail.id);

                if (previousSelectedId && previousSelectedId !== detail.id) {
                    this.updateExistingComponent(previousSelectedId);
                }
            }
            balanceCard.append(amount, amountType, balanceDescription, createdAt, selectButton);
        } else {
            const newAmount = document.createElement('input') as HTMLInputElement;
            newAmount.value = detail.amount.toString();
            newAmount.type = 'text';
            newAmount.placeholder = 'enter new amount...';
            newAmount.className = 'new-amount';

            const newDescription = document.createElement('input') as HTMLInputElement;
            newDescription.value = detail.description;
            newDescription.type = 'text';
            newDescription.placeholder = 'enter new description...';
            newDescription.className = 'new-description';
            
            const incomeTypeRadio = document.createElement('input') as HTMLInputElement;
            incomeTypeRadio.type = 'radio';
            incomeTypeRadio.id = `income-${detail.id}`;
            incomeTypeRadio.name = `amount-type-${detail.id}`;
            incomeTypeRadio.value = 'income';
            incomeTypeRadio.checked = (detail.type === 'income');
            
            const expenseTypeRadio = document.createElement('input') as HTMLInputElement;
            expenseTypeRadio.type = 'radio';
            expenseTypeRadio.id = `expense-${detail.id}`;
            expenseTypeRadio.name = `amount-type-${detail.id}`;
            expenseTypeRadio.value = 'expense';
            expenseTypeRadio.checked = (detail.type === 'expense');
            
            const incomeLabel = document.createElement('label') as HTMLLabelElement;
            incomeLabel.htmlFor = `income-${detail.id}`;
            incomeLabel.textContent = 'Income';
            
            const expenseLabel = document.createElement('label') as HTMLLabelElement;
            expenseLabel.htmlFor = `expense-${detail.id}`;
            expenseLabel.textContent = 'Expense';
            
            const firstRadioWrap = document.createElement('div') as HTMLDivElement;
            firstRadioWrap.className = 'type-1';
            firstRadioWrap.append(incomeTypeRadio, incomeLabel);

            const secondRadioWrap = document.createElement('div') as HTMLDivElement;
            secondRadioWrap.className = 'type-2';
            secondRadioWrap.append(expenseTypeRadio, expenseLabel);

            const radioButtonGroup = document.createElement('div') as HTMLDivElement;
            radioButtonGroup.className = 'radio-button-group';

            const buttonWrapForEdit = document.createElement('div') as HTMLDivElement;
            buttonWrapForEdit.className = 'button-wrap-edit';

            const changeButton = document.createElement('button') as HTMLButtonElement;
            changeButton.textContent = 'Save';
            changeButton.className = 'change-button';
            changeButton.onclick = async (): Promise<void> => {
                const newTrimmedAmount = Number(newAmount.value.trim());
                const newTrimmedDesc = newDescription.value.trim();

                const selectedRadio = radioButtonGroup.querySelector(`input[name="amount-type-${detail.id}"]:checked`) as HTMLInputElement;

                if (isNaN(newTrimmedAmount) || newTrimmedAmount <= 0 || newTrimmedDesc === '' || !selectedRadio) {
                    balanceNotification.createComponent('Invalid amount or type selected!');
                    balanceNotification.showComponent();
                    return;
                }

                try {
                    await dataStorage.changedSelectedData(detail.id, {
                        amount: newTrimmedAmount,
                        type: selectedRadio.value,
                        description: newTrimmedDesc
                    });
                    getSelectedId = null;
                    this.updateExistingComponent(detail.id);
                } catch (error) {
                    balanceNotification.createComponent(`Failed to save change: ${error}`);
                    balanceNotification.showComponent();
                }
            }

            const cancelButton = document.createElement('button') as HTMLButtonElement;
            cancelButton.className = 'Cancel';
            cancelButton.textContent = 'Cancel';
            cancelButton.onclick = () => {
                getSelectedId = null;
                this.updateExistingComponent(detail.id);
            }

            buttonWrapForEdit.append(changeButton, cancelButton);
            radioButtonGroup.append(firstRadioWrap, secondRadioWrap);
            balanceCard.append(newAmount, radioButtonGroup, newDescription, buttonWrapForEdit);
        }
        return balanceCard;
    },

    updateExistingComponent(balanceId: string): void {
        const existedComponent = balanceList.querySelector(`.balance-card[data-id="${balanceId}"]`);
        if (existedComponent) {
            const balanceDetail = dataStorage.currentData.get(balanceId);
            if (balanceDetail) {
                const newComponent = this.createComponent(balanceDetail);
                newComponent.dataset.id = balanceDetail.id;
                existedComponent.replaceWith(newComponent);
            } else {
                existedComponent.remove();

                if (dataStorage.currentData.size === 0) {
                    balanceList.innerHTML = '';
                    balanceList.textContent = 'No Balance Added Yet';
                }
            }
        } else {
            this.showAllBalance(dataStorage.toArray());
        }
    },

    async dequeueBalanceData(): Promise<void> {
        const balanceData = dataStorage.toArray();
        try {
            if (balanceData.length > 0) await dataStorage.dequeue();
            else {
                balanceList.innerHTML = '';
                balanceList.textContent = 'No Balance Added Yet';
            }
        } catch (error) {
            balanceNotification.createComponent(`Failed to delete: ${error}`);
            balanceNotification.showComponent();
        }
    },

    async removeAllBalance(): Promise<void> {
        const balanceData = dataStorage.toArray();
        try {
            if (balanceData.length > 0) {
                await dataStorage.clearQueue();
                balanceList.innerHTML = '';
                balanceList.textContent = 'No Balance Added Yet';
            } else {
                balanceNotification.createComponent('No Balance Added Yet');
                balanceNotification.showComponent();
                balanceList.innerHTML = '';
                balanceList.textContent = 'No Balance Added Yet';
            }
        } catch (error) {
            balanceNotification.createComponent(`Failed to delete all: ${error}`);
            balanceNotification.showComponent();
        }
    },

    teardownBalance(): void {
        dataStorage.teardownTable();
        balanceNotification.teardownComponent();
        getSelectedId = null;
    }
});

async function initBalanceWithQueueDS(): Promise<void> {
    await balanceWithQueueDS().initEventListeners();
}

function teardownBalanceWithQueueDS(): void {
    balanceWithQueueDS().teardownBalance();
}

document.addEventListener('DOMContentLoaded', initBalanceWithQueueDS);
window.addEventListener('beforeunload', teardownBalanceWithQueueDS);