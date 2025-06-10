import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "./supabase-config";

interface BaseModel {
    id: string;
    created_at: Date;
}

interface ListNode<T> {
    data: T;
    next: ListNode<T> | null;
    prev: ListNode<T> | null; // Untuk implementasi doubly linked list
}

class TableStorage <XDDD extends BaseModel> {
    protected currenData: Map<string, ListNode<XDDD>> = new Map<string, ListNode<XDDD>>();
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected async realtimeInit(
        callback: (data: XDDD[]) => void, initialQuery?: (query: any) => any
    ): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`TableStorage for ${this.tableName} is already initialized.`);
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.realtimeChannel = supabase.channel(`channel-${this.tableName}`);
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<XDDD>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        const newData = this.processData(payload.new);
                        this.currenData.set(newData.id, newData);
                        break;
                    }
                    case "UPDATE": {
                        const changeData = this.processData(payload.new);
                        this.currenData.set(changeData.id, changeData);
                        break;
                    }
                    case "DELETE":{
                        const data = payload.old.id;
                        if (data) this.currenData.delete(data);
                        break;
                    }
                }
                callback(Array.from(this.currenData.values()));
            }
        );

        try {
            let query = supabase
            .from(this.tableName)
            .select('*');

            const { data, error } = await query;

            if (initialQuery) query = initialQuery(query);

            if (error) throw error;

            this.currenData.clear();
            data.forEach(dt => {
                const process = { ...dt, created_at: new Date(dt.created_at) } as XDDD;
                this.currenData.set(process.id, process);
            });
            
            callback(Array.from(this.currenData.values()));
            this.realtimeChannel.subscribe();
            this.isInitialized = true;
        } catch (error) {
            this.realtimeChannel = null;
            this.isInitialized = false;
            callback([]);
            throw new Error(`Something went wrong ${error}`);
        }
    }

    private processData(data: any): XDDD {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as XDDD;
        }
        return data as XDDD;
    }

    protected async changeSelectedData(id: string, newData: Partial<Omit<XDDD, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    }

    protected async removeAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    protected teardownTable(): void {
        this.currenData.clear();
        this.isInitialized = false;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }
}

export default TableStorage;