import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";;

class DataManager <V extends { id: string }> {
    protected tableName: string;
    protected currentData: Map<string, V> = new Map<string, V>();
    private isInitialized: boolean = false;
    private realtimeChannel: RealtimeChannel | null = null;

    protected constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected async realtimeInit(callback: (data: V[]) => void): Promise<void> {
        if (this.realtimeChannel && this.isInitialized) {
            console.warn(`Storage for ${this.tableName} has been initialized!`);
            callback(this.toArray());
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
                switch (payload.eventType) {
                    case 'INSERT': {
                        const newItem = this.processItem(payload.new);
                        this.currentData.set(newItem.id, newItem);
                        break;
                    }
                    case 'UPDATE': {
                        const updatedItem = this.processItem(payload.new);
                        this.currentData.set(updatedItem.id, updatedItem);
                        break;
                    }
                    case 'DELETE': {
                        const deletedId = payload.old.id;
                        if (deletedId) this.currentData.delete(deletedId);
                        break;
                    }
                }
                callback(this.toArray());
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

        this.currentData.clear();
        data.forEach(dt => {
            const processed = this.processItem(dt);
            this.currentData.set(processed.id, processed);
        });

        callback(this.toArray());
        this.realtimeChannel.subscribe(); 
        this.isInitialized = true;
    }

    
    private processItem(item: any): V {
        if (item && item.created_at && typeof item.created_at === "string") {
            return { ...item, created_at: new Date(item.created_at) } as V;
        }
        return item as V;
    }

    protected async insertData(new_data: Omit<V, 'id'>): Promise<string> {
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

    protected async deleteData(id: string): Promise<void>
    protected async deleteData(id?: string): Promise<void>
    protected async deleteData(id?: string): Promise<void> {
        if (id !== undefined) {
            const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

            if (error) throw error;
        } else {
            const { error } = await supabase
            .from(this.tableName)
            .delete()
            .not('id', 'is', null);

            if (error) throw error;
        }
    }

    protected toArray(): V[] {
        return Array.from(this.currentData.values());
    }

    protected teardownStorage(): void {
        this.currentData.clear();
        this.isInitialized = false;
        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }
    }
}

export default DataManager;