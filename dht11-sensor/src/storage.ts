import supabase from "./supabase-config";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

class Storage <CFV extends { id: string }> {
    protected tableName: string;
    protected currentData: CFV[] = [];

    protected constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected realtimeInit(callback: (data: CFV[]) => void): RealtimeChannel {
        const channel = supabase.channel('any');
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<CFV>) => {
                const processItem = (item: any): CFV => ({
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
            })) as CFV[];

            callback(this.currentData);
            channel.subscribe(); // Mulai subscribe setelah data awal dimuat
        })();

        return channel;
    }

    async deleteSelectedData(id: string) {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
        
        if (error) throw error;
    }

    async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(this.tableName)
        .delete()
        .not('id', 'is', null);

        if (error) throw error;
    }
}

export default Storage;