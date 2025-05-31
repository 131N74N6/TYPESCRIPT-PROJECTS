import supabase from "./supabase-config";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";;

class DataManager <V extends { id: string }> {
    protected tableName: string;
    protected currentData: V[] = [];

    protected constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected realtimeInit(callback: (data: V[]) => void): RealtimeChannel {
        const channel = supabase.channel('any');
        // Pasang handler realtime
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<V>) => {
                const processItem = (item: any): V => ({
                    ...item,
                    created_at: new Date(item.created_at)
                });

                switch (payload.eventType) {
                    case 'INSERT': {
                        const newItem = processItem(payload.new);
                        this.currentData.push(newItem);
                        break;
                    }
                    case 'UPDATE': {
                        const updatedItem = processItem(payload.new);
                        const index = this.currentData.findIndex(item => item.id === updatedItem.id);
                        if (index !== -1) this.currentData[index] = updatedItem;
                        break;
                    }
                    case 'DELETE': {
                        const deletedId = payload.old.id;
                        this.currentData = this.currentData.filter(item => item.id !== deletedId);
                        break;
                    }
                }
                callback([...this.currentData]);
            }
        );
        // Fetch data awal
        (async () => {
            const { data, error } = await supabase
            .from(this.tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData = data.map(item => ({
                ...item, created_at: new Date(item.created_at)
            })) as V[];

            callback(this.currentData);
            channel.subscribe(); // Mulai subscribe setelah data awal dimuat
        })();

        return channel;
    }

    protected async addToStorage(new_data: Omit<V, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(this.tableName)
        .insert([new_data])
        .select();
        
        if (error) throw error;
        return data[0].id;
    }

    protected async changeSelectedData(id: string, new_data: Partial<Omit<V, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .update(new_data)
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteSelectedData(id: string): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

        if (error) throw error;
    }

    protected async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }

    protected teardownStorage(): void {
        this.currentData = [];
    }
}

export default DataManager;