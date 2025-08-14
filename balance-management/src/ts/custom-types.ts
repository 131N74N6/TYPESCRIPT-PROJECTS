export type DatabaseProps<Y> = {
    tableName: string;
    callback: (data: Y[]) => void;
    initialQuery?: (query: any) => any;
    relationalQuery?: string;
}

export type InsertDataProps<G> = {
    tableName: string;
    newData: Omit<G, 'id' | 'created_at'>;
}

export type UpsertDataProps<X> = {
    tableName: string;
    upsertedData: Partial<X>;
}

export type UpdateDataProps<L> = {
    tableName: string; 
    values: string; 
    newData: Partial<Omit<L, 'id'>>
}

export type DeleteDataProps = {
    tableName: string; 
    column?: string;
    values?: string | string[];
}

export type BalanceDetail = {
    id: string;
    amount: number;
    type: string;
    created_at: Date;
    description: string;
    user_id: string;
}

export type Users = {
    id: string;
    email: string;
    username: string;
    password: string;
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
    description: HTMLInputElement;
    username: HTMLDivElement;
}