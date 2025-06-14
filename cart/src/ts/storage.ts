import supabase from "./supabase-config";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const Storage = <HSR extends { id: string }>(tableName: string) => {
    async function insert(new_data: Omit<HSR, 'id'>): Promise<string>;
    async function insert(id?: string): Promise<string>;

    async function insert(new_data: Omit<HSR, 'id'>, id?: string): Promise<string> {
        let insertPayload: Partial<HSR>;
        if (id !== undefined) {
            // Jika ID disediakan, gunakan ID tersebut
            insertPayload = { ...new_data, id } as HSR;
        } else {
            // Jika tidak, biarkan database generate ID
            insertPayload = new_data;
        }

        const { data, error } = await supabase
            .from(tableName)
            .insert([insertPayload])
            .select();

        if (error) throw error;
        return data[0].id;
    }

    return {
        insert,
        isInitialize: false as boolean,
        realtimeChannel: null as RealtimeChannel | null,
        currentData: new Map<string, HSR>() as Map<string, HSR>,

        async realtimeInit(callback: (data: HSR[]) => void): Promise<void> {
            if (this.realtimeChannel && this.isInitialize) {
                console.warn(`Storage for ${tableName} has been initialized`);
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
                { event: '*', schema: 'public', table: tableName },
                (payload: RealtimePostgresChangesPayload<HSR>) => {
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
            .from(tableName)
            .select('*');

            if (error) {
                console.error('Initial data fetch error:', error);
                callback([]);
                return;
            }

            this.currentData.clear();
            data.forEach(dt => {
                const processed = { ...dt, created_at: new Date(dt.created_at) } as HSR;
                this.currentData.set(processed.id, processed);
            });

            callback(this.toArray());
            this.realtimeChannel.subscribe(); 
            this.isInitialize = true;
        },

        processItem(item: any): HSR {
            if (item && item.created_at && typeof item.created_at === 'string') {
                return { ...item, created_at: new Date(item.created_at) } as HSR;
            }
            return item as HSR;
        },

        async changeSelectedData(id: string, new_data: Partial<Omit<HSR, 'id'>>): Promise<void> {
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
        },

        toArray(): HSR[] {
            return Array.from(this.currentData.values());
        },

        teardownStorage(): void {
            this.currentData.clear();
            this.isInitialize = false;
            if (this.realtimeChannel) {
                this.realtimeChannel.unsubscribe();
                this.realtimeChannel = null;
            }
        }
    }
}

export default Storage;