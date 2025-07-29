import TableStorage from "./supabase-table";
import Modal from "./modal";
import type { BalanceDetail, BalanceHandlerProps } from "./custom-types";

const balanceTable = TableStorage<BalanceDetail>("finance_list");
const controller = new AbortController();

const BalanceHandler = (props: BalanceHandlerProps) => ({
    getSelectedId: null as string | null,
    balanceNotification: Modal(props.notification),
    totalIncome: 0 as number,
    totalExpense: 0 as number,
    balanceDifference: 0 as number,

    async initEventListeners(): Promise<void> {
        await balanceTable.realtimeInit((data) => this.showAllBalanceData(data));

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("#delete-all-list")) await this.deleteAllBalanceList();
        }, { signal: controller.signal });

        props.balanceInputField.addEventListener("submit", async (event) => await this.submitData(event), { 
            signal: controller.signal 
        });

        props.oldest.addEventListener("change", () => { 
            props.newest.checked = false; 
            this.showAllBalanceData(balanceTable.toArray());
            console.log("testing");
        }, { signal: controller.signal });

        props.newest.addEventListener("change", () => { 
            props.oldest.checked = false; 
            this.showAllBalanceData(balanceTable.toArray());
        }, { signal: controller.signal });
    },

    async submitData(event: SubmitEvent): Promise<void> {
        event.preventDefault();
        const trimmedAmount = Number(props.getBalance.value.trim());
        const trimmedDescription = props.description.value.trim();
        const selectedType = (document.querySelector('input[name="category"]:checked') as HTMLInputElement);

        if (isNaN(trimmedAmount) || !selectedType) {
            this.balanceNotification.createModal('Missing required data!');
            this.balanceNotification.showModal();
            return;
        }
        
        await balanceTable.insertData({
            amount: Number(props.getBalance.value.trim()),
            type: selectedType.value,
            description: trimmedDescription || '-'
        });
        
        this.resetForm();
    },

    resetForm(): void {
        props.balanceInputField.reset();
        this.getSelectedId = null;
    },

    showAllBalanceData(balanceData: BalanceDetail[]): void {
        const fragment = document.createDocumentFragment();
        this.totalIncome = 0;
        this.totalExpense = 0;
        this.balanceDifference = 0;

        try {
            if (balanceData.length > 0) {
                let modifiedData = balanceData;

                if (props.oldest.checked) {
                    modifiedData = [...balanceData].sort((a: BalanceDetail, b: BalanceDetail) => {
                        return a.created_at.getTime() - b.created_at.getTime()
                    });
                } else if (props.newest.checked) {
                    modifiedData = [...balanceData].sort((a: BalanceDetail, b: BalanceDetail) => {
                        return b.created_at.getTime() - a.created_at.getTime()
                    });
                }

                modifiedData.forEach(detail => {
                    if (detail.type.toLowerCase() === 'income') {
                        this.totalIncome += detail.amount;
                    } else if (detail.type.toLowerCase() === 'expense') {
                        this.totalExpense += detail.amount;
                    }
                    fragment.appendChild(this.createListComponent(detail));
                });
                
                props.balanceList.innerHTML = '';
                props.balanceList.appendChild(fragment);

                this.balanceDifference = this.totalIncome - this.totalExpense;
                props.incomeTotal.textContent = `Income = Rp ${this.totalIncome.toLocaleString()}`;
                props.expenseTotal.textContent = `Expense = Rp ${this.totalExpense.toLocaleString()}`;
                props.income_expense.textContent = `Both Total = Rp ${this.balanceDifference.toLocaleString()}`;
            } else {
                this.totalIncome = 0;
                this.totalExpense = 0;
                this.balanceDifference = 0;

                props.incomeTotal.textContent = `Income = Rp 0`;
                props.expenseTotal.textContent = `Expense = Rp 0`;
                props.income_expense.textContent = `Both Total = Rp 0`;
                
                props.balanceList.innerHTML = '';
                props.balanceList.textContent = "...Empty...";
            }
        } catch (error) {
            this.totalIncome = 0;
            this.totalExpense = 0;
            this.balanceDifference = 0;

            props.incomeTotal.textContent = `Income = Rp 0`;
            props.expenseTotal.textContent = `Expense = Rp 0`;
            props.income_expense.textContent = `Both Total = Rp 0`;
            
            props.balanceList.innerHTML = '';
            props.balanceList.textContent = `Failed to load balance: ${error}`;
        }
    },

    createListComponent(detail: BalanceDetail): HTMLElement {
        const balanceWrap = document.createElement("div");
        balanceWrap.className = "balance-wrap";
        balanceWrap.dataset.id = detail.id;

        if (this.getSelectedId === detail.id) {
            // Edit mode
            const newAmountInput = document.createElement("input");
            newAmountInput.type = "text";
            newAmountInput.placeholder = 'Insert new amount';
            newAmountInput.value = detail.amount.toString();
            newAmountInput.className = "edit-amount";

            const incomeLabel = document.createElement('label') as HTMLLabelElement;
            incomeLabel.htmlFor = `income-${detail.id}`;
            incomeLabel.textContent = 'Income';

            const incomeRadioButton = document.createElement('input') as HTMLInputElement;
            incomeRadioButton.id = `income-${detail.id}`;
            incomeRadioButton.name = `amount-type-${detail.id}`;
            incomeRadioButton.type = 'radio';
            incomeRadioButton.value = 'income';
            incomeRadioButton.checked = (detail.type === 'income');

            const expenseLabel = document.createElement('label') as HTMLLabelElement;
            expenseLabel.htmlFor = `expense-${detail.id}`;
            expenseLabel.textContent = 'Expense';

            const expenseRadioButton = document.createElement('input') as HTMLInputElement;
            expenseRadioButton.id = `expense-${detail.id}`;
            expenseRadioButton.name = `amount-type-${detail.id}`;
            expenseRadioButton.type = 'radio';
            expenseRadioButton.value = 'expense';
            expenseRadioButton.checked = (detail.type === 'expense');

            const newDescription = document.createElement('input') as HTMLInputElement;
            newDescription.type = 'text';
            newDescription.className = 'new-description';
            newDescription.value = detail.description;

            const buttonWrap = document.createElement("div");
            buttonWrap.className = "button-wrap";
            buttonWrap.style.display = "flex";
            buttonWrap.style.gap = "0.6rem";

            const firstRadioWrap = document.createElement('div') as HTMLDivElement;
            firstRadioWrap.className = 'type-1';
            firstRadioWrap.append(incomeRadioButton, incomeLabel);

            const secondRadioWrap = document.createElement('div') as HTMLDivElement;
            secondRadioWrap.className = 'type-2';
            secondRadioWrap.append(expenseRadioButton, expenseLabel);

            const radioButtonGroup = document.createElement('div') as HTMLDivElement;
            radioButtonGroup.className = 'radio-button-group';
            radioButtonGroup.append(firstRadioWrap, secondRadioWrap);

            const changeButton = document.createElement("button");
            changeButton.textContent = "Save";
            changeButton.className = "change-button";
            changeButton.onclick = async () => {
                const selectedType = radioButtonGroup.querySelector(`input[name="amount-type-${detail.id}"]:checked`) as HTMLInputElement;
                const trimmedNewAmount = Number(newAmountInput.value.trim());
                const trimmedNewDescription = newDescription.value.trim();

                if (isNaN(trimmedNewAmount) || trimmedNewAmount <= 0 || !selectedType) {
                    this.balanceNotification.createModal('Missing required data!');
                    this.balanceNotification.showModal();
                    return;
                }

                try {
                    await balanceTable.changeSelectedData(detail.id, {
                        amount: trimmedNewAmount,
                        type: selectedType.value,
                        description: trimmedNewDescription || '-'
                    });
                    
                    this.getSelectedId = null;
                    this.updateExistingComponent(detail.id);
                } catch (error) {
                    this.balanceNotification.createModal(`Failed to change: ${error}`);
                    this.balanceNotification.showModal();
                }
            }

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.className = "cancel-button";
            cancelButton.onclick = () => {
                this.getSelectedId = null;
                this.updateExistingComponent(detail.id);
            }

            buttonWrap.append(changeButton, cancelButton);
            balanceWrap.append(newAmountInput, radioButtonGroup, newDescription, buttonWrap);
        } else {
            // View mode
            const balanceData = document.createElement("div") as HTMLDivElement;
            balanceData.className = "balance-data";
            balanceData.textContent = `Amount: Rp ${detail.amount}`;

            const balanceType = document.createElement("div") as HTMLDivElement;
            balanceType.className = "balance-type";
            balanceType.textContent = `Category: ${detail.type}`;

            const balanceDescription = document.createElement("div") as HTMLDivElement;
            balanceDescription.className = 'balance-description';
            balanceDescription.textContent = `Desctiption: ${detail.description}`;

            const createdAt = document.createElement("div") as HTMLDivElement;
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
                const previousId = this.getSelectedId;
                this.getSelectedId = detail.id;
                this.updateExistingComponent(detail.id);

                if (previousId && previousId !== detail.id) {
                    this.updateExistingComponent(previousId);
                }
            }

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-button";
            deleteButton.onclick = async () => {
                const balanceData = balanceTable.toArray();
                try {
                    if (balanceData.length > 0) {
                        await this.deleteSelectedBalance(detail.id);
                    } else {                        
                        this.balanceNotification.createModal('No balance added!');
                        this.balanceNotification.showModal();
                        props.balanceList.innerHTML = '';
                        props.balanceList.textContent = "...Empty...";
                    }
                } catch (error) {
                    this.balanceNotification.createModal(`Failed to delete: ${error}`);
                    this.balanceNotification.showModal();
                }
            }

            buttonWrap.append(selectButton, deleteButton);
            balanceWrap.append(balanceData, balanceType, balanceDescription, createdAt, buttonWrap);
        }

        return balanceWrap;
    },

    async deleteSelectedBalance(id: string): Promise<void> {
        const balanceData = balanceTable.toArray();
        try {
            if (balanceData.length > 0) {
                await balanceTable.deleteSelectedData(id);
            } else {
                props.balanceList.innerHTML = '';
                props.balanceList.textContent = "...Empty...";
            }
        } catch (error) {
            this.balanceNotification.createModal(`Failed to delete data: ${error}`);
            this.balanceNotification.showModal();
        }
    },

    async deleteAllBalanceList(): Promise<void> {
        const balanceData = balanceTable.toArray();
        try {
            if (balanceData.length > 0) {
                await balanceTable.deleteAllData();
                props.balanceList.innerHTML = '';
                props.balanceList.textContent = "...Empty...";
            } else {
                this.balanceNotification.createModal('No data added!');
                this.balanceNotification.showModal();
            }
        } catch(error) {
            this.balanceNotification.createModal(`Failed to delete all :${error}`);
            this.balanceNotification.showModal();
        }
    },

    cleanup(): void {
        this.resetForm();
        controller.abort();
        this.balanceNotification.teardownModal();
        balanceTable.teardownStorage();
    },

    updateExistingComponent(balanceId: string): void {
        const existingComponent = props.balanceList.querySelector(`.balance-wrap[data-id="${balanceId}"]`);
        const balanceData = balanceTable.toArray();
        if (existingComponent) {
            const detail = balanceTable.currentData.get(balanceId);
            if (detail) {
                const newComponent = this.createListComponent(detail);
                newComponent.dataset.id = balanceId;
                existingComponent.replaceWith(newComponent);
            } else {
                existingComponent.remove();

                if (balanceData.length === 0) {
                    props.balanceList.innerHTML = '';
                    props.balanceList.textContent = "...Empty...";
                }
            }
        } else {
            this.showAllBalanceData(balanceData);
        }
    }
});

export default BalanceHandler;