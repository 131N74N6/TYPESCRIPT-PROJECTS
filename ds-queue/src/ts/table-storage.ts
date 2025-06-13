import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "./supabase-config";

type BaseData = {
    id: string;
    created_at: Date; 
    [key: string]: any; // Memungkinkan properti lain
}

const TableStorage = <ZZZ extends BaseData>(tableName: string) => ({
    currentData: new Map<string, ZZZ>() as Map<string, ZZZ>,
    realtimeChannel: null as RealtimeChannel | null ,
    isInitialized: false as boolean,

    async realtimeInit(callback: (data: ZZZ[])=> void, initialQuery?: (query: any) => any): Promise<void> {
        if (this.isInitialized && this.realtimeChannel) {
            console.warn(`TableStorage for ${tableName} is already initialized.`);
            // Panggil callback dengan data yang sudah ada jika sudah diinisialisasi
            callback(this.toArray());
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.realtimeChannel = supabase.channel(`table_${tableName}`);
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: RealtimePostgresChangesPayload<ZZZ>) => {
                switch(payload.eventType) {
                    case "INSERT": {
                        const insertedData = this.processData(payload.new);
                        this.currentData.set(insertedData.id, insertedData);
                        break;
                    }
                    case "UPDATE": {
                        const changedData = this.processData(payload.new);
                        this.currentData.set(changedData.id, changedData);
                        break;
                    }
                    case "DELETE": {
                        const deletedData = payload.old.id;
                        if (deletedData) this.currentData.delete(deletedData);
                        break;
                    }
                }
                callback(this.toArray());
            }
        );

        try {
            let query = supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: true });

            const { data, error } = await query;

            if (initialQuery) query = initialQuery(query);

            if (error) throw error;

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as ZZZ;
                this.currentData.set(processed.id, processed);
            });

            callback(this.toArray());
            this.realtimeChannel.subscribe();
            this.isInitialized = true;
        } catch (error) {
            callback([]);
            this.realtimeChannel = null;
            this.isInitialized = false;
            throw new Error(`Failed to load data: ${error}`);
        }
    },

    processData(data: any): ZZZ {
        if (data && data.created_at && typeof data.created_at === 'string') {
            return { ...data, created_at: new Date(data.created_at) } as ZZZ;
        } 
        return data as ZZZ
    },

    async addQueue(newData: Omit<ZZZ, 'id'>):Promise<string> {
        const { data, error } = await supabase
        .from(tableName)
        .insert([newData])
        .select()

        if (error) throw error;

        return data[0].id;
    },

    async dequeue(): Promise<void> {
        const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1);

        if (error) throw error;

        const firstData = data[0];

        const { error: errorDequeue } = await supabase
        .from(tableName)
        .delete()
        .eq('id', firstData.id);

        if (errorDequeue) throw errorDequeue.message;
    },

    async changedSelectedData(id: string, newData: Partial<Omit<ZZZ, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error;
    },

    async clearQueue(): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    },

    teardownTable(): void {
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
        this.isInitialized = false;
        this.currentData.clear();
    },

    toArray(): ZZZ[] {
        return Array.from(this.currentData.values());
    }
});

export default TableStorage;