export type DatabaseProps<R> = {
    tableName: string;
    callback: ((data: R[]) => void);
    additionalQuery?: ((query: any) => any);
    relationalQuery?: string;
}

export type Users = {
    id: string;
    email: string;
    username: string;
    password: string;
}

export type Profile = {
    id: string;
    user_id: string;
    full_name: string;
    nip_or_nim: string;
    class: string;
    created_at: Date;
}

export type AttendanceSetting = {
    id: string;
    user_id: string;
    start_time: string;
    end_time: string;
    date: string;
    created_at: Date;
}

export type Attendance = {
    id: string;
    student_id: string;
    setting_id: string;
    status: string;
    created_at: Date;
}

export type InsertDataProps<L> = {
    tableName: string;
    newData: Omit<L, 'id' | 'created_at'>;
}

export type UpsertDataProps<X> = {
    tableName: string;
    upsertedData: Partial<X>;
}

export type UpdateDataProps<H> = {
    tableName: string;
    column: string;
    values: string | string[];
    newData: Partial<H>;
}

export type DeleteDataProps = {
    tableName: string;
    column: string;
    values: string | string[];
}

export type ModalType = {
    createModal: (message: string, type?: 'success' | 'error') => void;
    showMessage: (duration?: number) => void;
    teardown: () => void;
}

export type SettingsFormProps = {
    container: HTMLElement; 
    userId: string; 
    notification: any;
    signal: AbortSignal;
}

export type AttendanceListProps = {
    container: HTMLElement; 
    notification: any;
    signal: AbortSignal;
}