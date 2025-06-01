import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const Storage = <LTH extends { id: string }>(tableName: string) => ({
    currentData: [] as LTH[],

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
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData = data.map(item => ({
                ...item, created_at: new Date(item.created_at)
            })) as LTH[];

            callback(this.currentData);
            channel.subscribe(); // Mulai subscribe setelah data awal dimuat
        })();
        return channel;
    },

    saveToStorage1(): void {},

    async saveToStorage1(id: string): Promise<void> {

    },

    async changeSelectedData1(new_data: Omit<LTH, 'id'>): Promise<string> {
        const { data, error } = await supabase
        .from(tableName)
        .insert(new_data)
        .select();

        if (error) throw error;
        return data[0].id;
    },

    async changeSelectedData2(id: string, new_data: Partial<Omit<LTH, 'id'>>): Promise<void> {
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