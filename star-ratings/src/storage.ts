import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";;

class DataManager <V extends { id: string }> {
    protected tableName: string;
    protected currentData: V[] = [];
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;

    protected constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected async realtimeInit(callback: (data: V[]) => void): Promise<void> {
        if (this.realtimeChannel && this.isInitialized) {
            console.warn(`Storage for ${this.tableName} has been initialized!`);
            callback([...this.currentData]);
            return;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.realtimeChannel = supabase.channel('any');
        this.realtimeChannel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: this.tableName },
            (payload: RealtimePostgresChangesPayload<V>) => {
                const processItem = (item: any): V => {
                    if (item && item.created_at && typeof item.created_at === "string") {
                        return { ...item, created_at: new Date(item.created_at) } as V;
                    }
                    return item as V;
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
        this.realtimeChannel.subscribe(); 
        this.isInitialized = true;
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
        this.isInitialized = false;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }
}

export default DataManager;