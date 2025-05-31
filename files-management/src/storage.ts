import supabase from './supabase-config';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const DataStorages = <N extends { id: number }>(tableName: string) => ({
    currentData: [] as N[],
    realtimeInit(callback: (data: N[]) => void): RealtimeChannel  {
        const channel = supabase.channel('any');
        // Pasang handler realtime
        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: RealtimePostgresChangesPayload<N>) => {
                const processItem = (item: any): N => ({
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
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData = data.map(item => ({
                ...item, created_at: new Date(item.created_at)
            })) as N[];

            callback(this.currentData);
            channel.subscribe(); // Mulai subscribe setelah data awal dimuat
        })();

        return channel;
    },

    async addToStorage(data: Omit<N, 'id'>): Promise<number> {
        const { data: inserted, error } = await supabase
        .from(tableName)
        .insert([data])
        .select();

        if (error) throw error
        return inserted[0].id
    },

    async changeSelectedData(id: number, newData: Partial<Omit<N, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error
    },

    async deleteSelectedData(id: number): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

        if (error) throw error
    },

    async deleteAllData(): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .delete()
        .not('id', 'is', null); 

        if (error) throw error
    },

    teardownStorage(): void {
        this.currentData = [];
    }
})

export default DataStorages;