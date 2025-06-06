import Storage from "./storage";
import Modal from "./modal";

type BalanceDetail = {
    id: string;
    amount: number;
    type: string;
    created_at: Date;
}

const storage = Storage<BalanceDetail>("finance_list");
const controller = new AbortController();

const Displayer = (
    getBalance: HTMLInputElement, balanceInputField: HTMLFormElement, balanceList: HTMLElement, 
    notification: HTMLElement, oldest: HTMLInputElement, newest: HTMLInputElement, incomeTotal: HTMLElement,
    expenseTotal: HTMLElement, income_expense: HTMLElement
) => ({
    getSelectedId: null as string | null,
    balanceNotification: Modal(notification),
    totalIncome: 0 as number,
    totalExpense: 0 as number,
    balanceDifference: 0 as number,

    initEventListeners(): void {
        storage.realtimeInit(() => {
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
            console.log("testing");
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
            created_at: new Date(),
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
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.balanceDifference = 0;

        if (storage.currentData.length > 0) {
            let modifiedData = storage.currentData;

            if (oldest.checked) {
                modifiedData = [...storage.currentData].sort((a: BalanceDetail, b: BalanceDetail) => {
                    return a.created_at.getTime() - b.created_at.getTime()
                });
            }

            if (newest.checked) {
                modifiedData = [...storage.currentData].sort((a: BalanceDetail, b: BalanceDetail) => {
                    return b.created_at.getTime() - a.created_at.getTime()
                });
            }

            modifiedData.forEach(detail => {
                if (detail.type.toLowerCase() === 'income') {
                    this.totalIncome += detail.amount;
                } else if (detail.type.toLowerCase() === 'expense') {
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
            
            balanceList.innerHTML = '';
            balanceList.textContent = "...Empty...";
        }
    },

    createListComponent(detail: BalanceDetail): HTMLElement {
        const balanceWrap = document.createElement("div");
        balanceWrap.className = "balance-wrap";

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
            buttonWrap.style.display = "flex";
            buttonWrap.style.gap = "0.6rem";

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
        try {   
            await storage.deleteSelectedData(id);
            if (this.getSelectedId === null) this.resetForm();
        } catch (error) {
            this.balanceNotification.createModal(`Failed to delete data: ${error}`);
            this.balanceNotification.showModal();
        }
    },

    async deleteAllBalanceList(): Promise<void> {
        await storage.deleteAllData();
        balanceList.replaceChildren();
        this.showAllData();
    },

    cleanup(): void {
        this.resetForm();
        controller.abort();
        this.balanceNotification.teardownModal();
        storage.teardownStorage();
    }
});

export default Displayer;