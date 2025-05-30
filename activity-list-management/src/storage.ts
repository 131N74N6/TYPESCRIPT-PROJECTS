import supabase from "./supabase-config";
import type { RealtimeChannel } from "@supabase/supabase-js";

const StorageManager = <XYZ extends { id: string }>(tableName: string) => ({
    realtimeinit(callback: (data: XYZ[]) => void): RealtimeChannel  {
        (async () => {
            const { data, error } = await supabase
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            const processedData = data.map(item => ({
                ...item,
                created_at: new Date(item.created_at as any) 
            }));
            callback(processedData as XYZ[]);
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
                const processedData = data.map(item => ({
                    ...item,
                    created_at: new Date(item.created_at as any) 
                }));
                callback(processedData as XYZ[]);
            }
        )
        .subscribe();

        return subscription;
    },

    async addToStorage(newData: Omit<XYZ, 'id'>): Promise<string> {
        const { data: inserted, error } = await supabase
        .from(tableName)
        .insert([newData])
        .select();

        if (error) throw error
        return inserted[0].id;
    },

    async changeSelectedData(id: string, newData: Partial<Omit<XYZ, 'id'>>): Promise<void> {
        const { error } = await supabase
        .from(tableName)
        .update(newData)
        .eq('id', id);

        if (error) throw error
    },

    async deleteSelectedData(id: string): Promise<void> {
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
});

export default StorageManager;