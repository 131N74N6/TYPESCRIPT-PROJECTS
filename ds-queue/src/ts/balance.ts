import TableStorage from "./table-storage";
import Modal from "./modal";

type BalanceInfo = {
    id: string;
    created_at: Date;
    amount: number;
    type: string;
}

const dataStorage = TableStorage<BalanceInfo>('finance_list');
const controller = new AbortController();
const notification = document.getElementById('notification') as HTMLElement;
let getSelectedId: string | null = null;

const balanceNotification = Modal(notification);
const balanceInputField = document.getElementById('balance-input-field') as HTMLFormElement;
const balance = document.getElementById('balance') as HTMLInputElement;
const balanceList = document.getElementById('balance-list') as HTMLElement;

const balanceWithQueueDS = () => ({
    initEventListeners(): void {
        dataStorage.realtimeInit((data) => this.showAllBalance(data));

        balanceInputField.addEventListener('submit', async (event) => this.addNewBalance(event), {
            signal: controller.signal
        });
    },

    showAllBalance(balances: BalanceInfo[]): void {
        const fragment = document.createDocumentFragment();
        try {
            if (balances.length > 0) {
                balances.forEach(balance => fragment.appendChild(this.createComponent(balance)));
                balanceList.innerHTML = '';
                balanceList.appendChild(fragment);
            } else {
                balanceList.innerHTML = '';
                balanceList.textContent = 'No Balance Added Yet';
            }
        } catch (error) {
            balanceNotification.createComponent(`Failed to add balance: ${error}`);
            balanceNotification.showComponent();
        }
    },

    async addNewBalance(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedValue = balance.value.trim();
        const chosenTypeElement = document.querySelector('input[name="category"]:checked') as HTMLInputElement;

        await dataStorage.addQueue({
            created_at: new Date(),
            amount: Number(trimmedValue),
            type: chosenTypeElement.value
        });
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

            const createdAt = document.createElement('div') as HTMLDivElement;
            createdAt.className = 'created-at';
            createdAt.textContent = `Created At: ${detail.created_at.toLocaleString()}`;

            balanceCard.append(amount, amountType, createdAt);
        } else {
            const newAmount = document.createElement('input') as HTMLInputElement;
            newAmount.value = detail.amount.toString();
            newAmount.type = 'text';
            newAmount.placeholder = 'enter new amount...';
            newAmount.className = 'new-amount';

            const newAmountType = document.createElement('input') as HTMLInputElement;
            newAmountType.type = 'text';
            newAmountType.value = detail.type;
            newAmountType.placeholder = 'enter new amount type...';

            balanceCard.append(newAmount, newAmountType);
        }

        return balanceCard;
    },

    teardownBalance(): void {
        dataStorage.teardownTable();
        balanceNotification.teardownComponent();
    }
});

function initBalanceWithQueueDS(): void {
    balanceWithQueueDS().initEventListeners();
}

function teardownBalanceWithQueueDS(): void {
    balanceWithQueueDS().teardownBalance();
}

document.addEventListener('DOMContentLoaded', initBalanceWithQueueDS);
window.addEventListener('beforeunload', teardownBalanceWithQueueDS);