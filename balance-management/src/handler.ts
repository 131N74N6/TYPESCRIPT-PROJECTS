import Storage from "./storage";
import Modal from "./modal";

type BalanceDetail = {
    id: string;
    amount: number;
    type: string;
    created_at: Date;
}

const storage = Storage<BalanceDetail>("finance management");
const controller = new AbortController();

const Displayer = (
    getBalance: HTMLInputElement, balanceInputField: HTMLFormElement, balanceList: HTMLElement, 
    notification: HTMLElement, addBalance: HTMLButtonElement, oldest: HTMLInputElement, 
    newest: HTMLInputElement, incomeTotal: HTMLElement, expenseTotal: HTMLElement, 
    income_expense: HTMLElement
) => ({
    getSelectedId: null as string | null,
    currentData: [] as BalanceDetail[],
    balanceNotification: Modal(notification),
    totalIncome: 0 as number,
    totalExpense: 0 as number,
    balanceDifference: 0 as number,

    initEventListeners(): void {
        storage.realtimeInit((data) => {
            this.currentData = data;
            this.showAllData();
        });

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-list")) await this.deleteAllBalanceList();
        }, { signal: controller.signal });

        balanceInputField.addEventListener("submit", async (event) => await this.submitData(event), { 
            signal: controller.signal 
        });

        oldest.addEventListener("change", () => { 
            newest.checked = false; 
            this.showAllData();
        }, { signal: controller.signal });

        newest.addEventListener("change", () => { 
            oldest.checked = false; 
            this.showAllData();
        }, { signal: controller.signal });
    },

    async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const selectedType = (document.querySelector('input[name="category"]:checked') as HTMLInputElement);

        if (!getBalance.value.trim()) {
            this.balanceNotification.createModal("enter amount of balance");
            this.balanceNotification.showModal();
            return;
        }
        
        await storage.addToStorage({
            amount: Number(getBalance.value.trim()),
            type: selectedType.value,
            created_at: new Date()
        });
        
        this.resetForm();
    },

    resetForm(): void {
        balanceInputField.reset();
        this.getSelectedId = null;
    },

    showAllData(): void {
        balanceList.replaceChildren();

        if (this.currentData.length > 0) {
            let modifiedData = this.currentData;

            if (oldest.checked) {
                modifiedData = [...this.currentData].sort((a: BalanceDetail, b: BalanceDetail) => {
                    return a.created_at.getTime() - b.created_at.getTime()
                });
            }

            if (newest.checked) {
                modifiedData = [...this.currentData].sort((a: BalanceDetail, b: BalanceDetail) => {
                    return b.created_at.getTime() - a.created_at.getTime()
                });
            }

            modifiedData.forEach(detail => {
                if (detail.type.toLowerCase() === 'income') {
                    this.totalIncome += detail.amount;
                } else if (detail.type.toLowerCase() === 'expanse') {
                    this.totalExpense += detail.amount;
                }
                const component = this.createListComponent(detail);
                balanceList.appendChild(component);
            });

            this.balanceDifference = this.totalIncome - this.totalExpense;

            incomeTotal.textContent = `Income = Rp ${this.totalIncome.toLocaleString()}`;
            expenseTotal.textContent = `Expense = Rp ${this.totalExpense.toLocaleString()}`;
            income_expense.textContent = `Both Total = Rp ${this.balanceDifference.toLocaleString()}`;
        } else {
            this.totalIncome = 0;
            this.totalExpense = 0;
            this.balanceDifference = 0;

            incomeTotal.textContent = `Income = Rp 0`;
            expenseTotal.textContent = `Expense = Rp 0`;
            income_expense.textContent = `Both Total = Rp 0`;
            
            const component = document.createElement("div") as HTMLDivElement;
            component.className = "error-message-wrap";

            const message = document.createElement("div") as HTMLDivElement;
            message.textContent = "...Empty...";
            message.className = "message";
            component.appendChild(message);
            balanceList.appendChild(component)
        }
    },

    createListComponent(detail: BalanceDetail): HTMLElement {
        const balanceWrap = document.createElement("div");
        balanceWrap.className = "balance-wrap";

        if (this.getSelectedId === detail.id) {
            addBalance.disabled = true;
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
                    type: typeInput.value,
                    created_at: detail.created_at
                });
                this.getSelectedId = null;
                this.showAllData();
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
            addBalance.disabled = false;
            // View mode
            const balanceData = document.createElement("p") as HTMLParagraphElement;
            balanceData.className = "balance-data";
            balanceData.textContent = `Amount: Rp ${detail.amount}`;

            const balanceType = document.createElement("p") as HTMLParagraphElement;
            balanceType.className = "balance-type";
            balanceType.textContent = `Category: ${detail.type}`;

            const createdAt = document.createElement("p") as HTMLParagraphElement;
            createdAt.className = "created_at";
            createdAt.textContent = `Created at: ${detail.created_at.toLocaleString()}`;

            const buttonWrap = document.createElement("div");
            buttonWrap.className = "button-wrap";
            buttonWrap.style.display = "flex";
            buttonWrap.style.gap = "0.6rem";

            const selectButton = document.createElement("button");
            selectButton.textContent = "Select";
            selectButton.className = "select-button";
            selectButton.onclick = () => {
                this.getSelectedId = detail.id;
                this.showAllData();
            }

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";
            deleteButton.onclick = async () => {
                await this.deleteSelectedBalance(detail.id);
            }

            buttonWrap.append(selectButton, deleteButton);
            balanceWrap.append(balanceData, balanceType, createdAt, buttonWrap);
            balanceWrap.style.borderBottom = "2px solid black";
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
        this.showAllData();
    },

    cleanup(): void {
        controller.abort();
        this.resetForm();
    }
});

export default Displayer;