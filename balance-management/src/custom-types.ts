export type BalanceDetail = {
    id: string;
    amount: number;
    type: string;
    created_at: Date;
    description: string;
}

export type BalanceHandlerProps = {
    getBalance: HTMLInputElement; 
    balanceInputField: HTMLFormElement; 
    balanceList: HTMLElement; 
    notification: HTMLElement; 
    oldest: HTMLInputElement; 
    newest: HTMLInputElement; 
    incomeTotal: HTMLElement;
    expenseTotal: HTMLElement; 
    income_expense: HTMLElement; 
    description: HTMLInputElement
}