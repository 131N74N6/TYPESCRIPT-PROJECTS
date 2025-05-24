import Storage from "./storage";
import Modal from "./modal";

type BalanceDetail = {
    id: string;
    amount: number;
    type: string;
}

const storage = Storage<BalanceDetail>("finance management");
const controller = new AbortController();
let selectedType: HTMLInputElement;

const Displayer = (
    getBalance: HTMLInputElement, balanceInputField: HTMLFormElement, balanceList: HTMLElement, 
    notification: HTMLElement
) => ({
    getSelectedId: null as string | null,
    currentData: [] as BalanceDetail[],
    notification: Modal(notification) as {},

    initEventListeners(): void {
        storage.realtimeInit((data) => {
            this.currentData = data;
            this.showAllData();
        });

        balanceInputField.addEventListener("submit", async (event) => await this.submitData(event), { 
            signal: controller.signal 
        });
    },

    async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        selectedType = (document.querySelector('input[name="category"]:checked') as HTMLInputElement);
        
        await storage.addToStorage({
            amount: Number(getBalance.value.trim()),
            type: selectedType.value
        });
        
        this.resetForm();
    },

    resetForm(): void {
        balanceInputField.reset();
        this.getSelectedId = null;
    },

    showAllData(): void {
        balanceList.replaceChildren();
        this.currentData.forEach(detail => {
            const component = this.createListComponent(detail);
            balanceList.appendChild(component);
        });
    },

    createListComponent(detail: BalanceDetail): HTMLElement {
        const balanceWrap = document.createElement("div");
        balanceWrap.className = "balance-wrap";
        balanceWrap.id = `balance-${detail.id}`;

        if (this.getSelectedId === detail.id) {
            // Edit mode
            const amountInput = document.createElement("input");
            amountInput.type = "number";
            amountInput.value = detail.amount.toString();
            amountInput.className = "edit-amount";

            const typeInput = document.createElement("input");
            typeInput.type = "text";
            typeInput.value = detail.type;
            typeInput.className = "edit-type";

            const buttonWrap = document.createElement("div");
            buttonWrap.className = "button-wrap";

            const changeButton = document.createElement("button");
            changeButton.textContent = "Change";
            changeButton.className = "change-button";
            changeButton.onclick = async () => {
                await storage.changeSelectedData(detail.id, {
                    amount: Number(amountInput.value),
                    type: selectedType.value
                });
                this.getSelectedId = null;
            }

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.className = "cancel-button";
            cancelButton.onclick = () => {
                this.getSelectedId = null;
                this.showAllData();
            }

            buttonWrap.append(changeButton, cancelButton);
            balanceWrap.append(amountInput, typeInput, buttonWrap);
        } else {
            // View mode
            const balanceData = document.createElement("p");
            balanceData.className = "balance-data";
            balanceData.textContent = `Rp ${detail.amount}`;

            const balanceType = document.createElement("p");
            balanceType.className = "balance-type";
            balanceType.textContent = `Category: ${detail.type}`;

            const buttonWrap = document.createElement("div");
            buttonWrap.className = "button-wrap";

            const selectButton = document.createElement("button");
            selectButton.textContent = "Select";
            selectButton.className = "select-button";
            selectButton.onclick = () => {
                this.getSelectedId = detail.id;
                this.showAllData();
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";
            deleteButton.onclick = async () => {
                await this.deleteSelectedBalance(detail.id);
            };

            buttonWrap.append(selectButton, deleteButton);
            balanceWrap.append(balanceData, balanceType, buttonWrap);
        }

        return balanceWrap;
    },

    async deleteSelectedBalance(id: string): Promise<void> {
        await storage.deleteSelectedData(id);

        if (this.getSelectedId === null) this.resetForm();
    },

    async deleteAllBalanceList(): Promise<void> {
        await storage.deleteAllData();
        balanceList.replaceChildren();
    },

    cleanup(): void {
        controller.abort();
        this.resetForm();
    }
});

export default Displayer;