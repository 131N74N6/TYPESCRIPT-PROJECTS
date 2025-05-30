import supabase from './supabase-config';
import type { RealtimeChannel } from '@supabase/supabase-js';

const DataStorages = <N extends { id: number }>(tableName: string) => ({
    reailtimeInit(callback: (data: N[]) => void): RealtimeChannel {
        (async () => {
            const { data, error } = await supabase
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }
            // Penting: Pastikan created_at diubah ke objek Date jika dari DB adalah string ISO
            const processedData = data.map(item => ({
                ...item,
                created_at: new Date(item.created_at as any) // Konversi jika diperlukan
            }));
            callback(processedData as N[]);
        })();

        const subscription = supabase
        .channel('any')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            async (payload) => {
                console.log('Realtime change detected:', payload);
                const { data, error } = await supabase
                .from(tableName)
                .select('*');

                if (error) {
                    console.error('Realtime data fetch error:', error);
                    return;
                }
                // Penting: Pastikan created_at diubah ke objek Date jika dari DB adalah string ISO
                const processedData = data.map(item => ({
                    ...item,
                    created_at: new Date(item.created_at as any) // Konversi jika diperlukan
                }));
                callback(processedData as N[]);
            }
        )
        .subscribe();

        return subscription;
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
        .neq('id', '0'); // Delete all records

        if (error) throw error
    }
})

export default DataStorages;