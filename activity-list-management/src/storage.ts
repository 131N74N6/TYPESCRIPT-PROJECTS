import supabase from "./supabase-config";
import { RealtimeChannel, type RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const StorageManager = <SS extends { id: string }>(tableName: string) => ({
    currentData: [] as SS[],
    realtimeChannel: null as RealtimeChannel | null,

    async realtimeInit(callback: (data: SS[]) => void): Promise<void>  {
        this.realtimeChannel = supabase.channel('any');
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tableName },
            (payload: RealtimePostgresChangesPayload<SS>) => {
                const processItem = (item: any): SS => {
                    if (item && item.created_at && typeof item.created_at === 'string') {
                        return { ...item, created_at: new Date(item.created_at) } as SS;
                    } 
                    return item as SS;
                }

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
        })) as SS[];

        callback(this.currentData);
        if (this.realtimeChannel) this.realtimeChannel.subscribe();
    },

    async addToStorage(newData: Omit<SS, 'id'>): Promise<string> {
        const { data: inserted, error } = await supabase
        .from(tableName)
        .insert([newData])
        .select();

        if (error) throw error
        return inserted[0].id;
    },

    async changeSelectedData(id: string, newData: Partial<Omit<SS, 'id'>>): Promise<void> {
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
        .not('id', 'is', null); // Delete all records

        if (error) throw error
    },

    teardownStorage(): void {
        this.currentData = [];
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }
});

export default StorageManager;