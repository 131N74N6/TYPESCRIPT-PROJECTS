import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const Storage = <LTH extends { id: string }>(tableName: string, query: string) => ({
    currentData: new Map<string, LTH>() as Map<string, LTH>,
    sqlQuery: query,

    realtimeInit(callback: (data: LTH[]) => void): RealtimeChannel {
        const channel = supabase.channel('any');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: RealtimePostgresChangesPayload<LTH>) => {
                const processItem = (item: any): LTH => ({
                    ...item,
                    created_at: new Date(item.created_at)
                });

                switch (payload.eventType) {
                    case 'INSERT': {
                        const newItem = processItem(payload.new);
                        this.currentData.set(newItem.id, newItem);
                        break;
                    }
                    case 'UPDATE': {
                        const updatedItem = processItem(payload.new);
                        this.currentData.set(updatedItem.id, updatedItem);
                        break;
                    }
                    case 'DELETE': {
                        const deletedId = payload.old.id;
                        if (deletedId) this.currentData.delete(deletedId);
                        break;
                    }
                }
                callback(Array.from(this.currentData.values()));
            }
        );
        (async () => {
            const { data, error } = await supabase
            .from(tableName)
            .select(this.sqlQuery);

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as LTH;
                this.currentData.set(processed.id, processed);
            });

            callback(Array.from(this.currentData.values()));
            channel.subscribe(); 
        })();
        return channel;
    },

    async saveToStorage(new_data: Omit<LTH, 'id'>): Promise<void> {
        const { data, error } = await supabase
        .from(tableName)
        .insert([new_data])
        .select();

        if (error) throw error;
        return data[0].id;
    },

    async changeSelectedData(id: string, new_data: Partial<Omit<LTH, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .update(new_data)
        .eq('id', id);

        if (error) throw error;
    },

    async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

        if (error) throw error;
    },

    async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }
});

export default Storage;